const DB = require('../model/DB');
const client = DB.pool;
const ItoSeries = require('../model/itoSeries');
const Token = require('../model/itoToken');
const ITO = require('../model/ITO');
const AllotedItos = require('../model/allotedItos');
// const ITOAdmin = require("../model/itoAdmin");
const AuditLogs = require('../model/auditLogs');
const crypto = require('crypto');
const { ControlResponseStatusCode } = require('nexmo');

const createSeries = async (req, res, next) => {
  try {
    const ito = (await ITO.getITOById(req.body.ito_id)).rows[0];

    if (!ito) {
      return res
        .status(403)
        .json({ success: false, msg: `User ITO does not exist.` });
    }

    // restrict user who can create series
    // get alloted itos by ito id
    const allotedItos = (await AllotedItos.getAllotedITO(req.body.ito_id)).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot create series in this ITO.',
      });
    }

    if (['rejected', 'pending'].includes(ito.status)) {
      return res.status(400).json({
        success: false,
        msg: `Cannot create series on ${ito.status} ito`,
      });
    }

    //itoEnd,
    const [itoStart, now] = getStartAndEndTime(
      ito.start_date,
      // ito.end_date
    );

    if (ito.onhold || ito.closed) {
      return res.status(400).json({
        success: false,
        msg: `Cannot create series with onhold or closed ito`,
      });
    }

    const { start_date, end_date } = req.body;

    const [startTime, currentTime, endTime] = getStartAndEndTime(
      start_date,
      end_date,
    );

    // check if series start time is less than ito start time
    if (startTime < itoStart) {
      return res.status(400).json({
        success: false,
        msg: `Series - Can not start series before Ito start time`,
      });
    }

    if (startTime < currentTime) {
      return res.status(400).json({
        success: false,
        msg: `Can not start series with passed dates`,
      });
    }

    if (startTime >= endTime) {
      return res.status(403).json({
        success: false,
        msg: 'Start date can not be greater than or equal to end date',
      });
    }

    const itoToken = (await Token.getTokenByIto(ito.id)).rows[0];

    let { remaining_supply: token_remaining_supply } = itoToken;

    if (token_remaining_supply < req.body.supply) {
      return res
        .status(400)
        .json({ success: false, msg: 'Insufficient token remaining supply' });
    }

    const seriesBody = { ...req.body };

    seriesBody.user_id = req.user.id;
    seriesBody.remaining_supply = req.body.supply;
    seriesBody.status = 'pending';
    seriesBody.initial_series = false;
    seriesBody.created_at = new Date();
    seriesBody.updated_at = new Date();
    seriesBody.token_address = crypto
      .createHash('sha256')
      .update('secret')
      .digest('hex');

    await client.query('BEGIN');

    const series = await ItoSeries.createSeries(seriesBody);

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: 'Series created successfully',
      data: series.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(400).json({ success: false, msg: error.message });
  }
};

const verifySeriesCreationRequest = async (req, res, next) => {
  try {
    if (
      !req.body.status ||
      !['approved', 'rejected'].includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        msg: 'Status can only be approved or rejected',
      });
    }

    let series = (await ItoSeries.getSeriesById(req.params.id)).rows[0];

    if (!series) {
      return res
        .status(404)
        .json({ success: false, msg: 'No series found to verify' });
    }

    if (series.user_id === req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'You created this series. Your cannot verify this',
      });
    }

    // get alloted itos by ito id other than who created this series
    const allotedItos = (
      await AllotedItos.getAllotedITOToVerifyIto(series.ito_id, series.user_id)
    ).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot verify this Series.',
      });
    }

    if (series.user_approve) {
      return res
        .status(409)
        .json({ success: false, msg: 'Series already verified' });
    }

    if (series.end_date <= new Date()) {
      return res.status(400).json({
        success: false,
        msg: 'Cannot verify closed series',
      });
    }

    const fields = {
      status: req.body.status,
      user_approve: req.user.id,
    };

    await client.query('BEGIN');
    const seriesUpdated = await ItoSeries.updateSeries(fields, series.id, [
      'id',
      'status',
    ]);

    console.log('series updated ........', seriesUpdated.rows);
    if (seriesUpdated.rowCount > 0 && req.body.status === 'rejected') {
      //get data of rejected series

      console.log('series to be rejected ', series.id);
      const rejected_series = await ItoSeries.getSeriesById(series.id);
      console.log('rejected series in series draft', rejected_series.rows);
      const fields = {
        user_id: req.user.id,
        ito_id: rejected_series.rows[0].id,
        series_name: rejected_series.rows[0].name,
        description: rejected_series.rows[0].description,
        supply: rejected_series.rows[0].supply,
        start_date: rejected_series.rows[0].start_date,
        end_date: rejected_series.rows[0].end_date,
      };
      // req.body.user_id = req.user.id;
      const new_series = await ItoSeries.createDraft(fields);
      console.log('series updated in series draft', new_series);
    }

    if (req.body.status === 'approved') {
      const itoToken = (await Token.getTokenByIto(series.ito_id)).rows[0];

      let { remaining_supply } = itoToken;

      if (remaining_supply < series.supply) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          msg: 'Cannot verify - Insufficient token remaining supply',
        });
      }

      remaining_supply -= series.supply;

      await Token.updateToken(itoToken.id, {
        remaining_supply,
      });

      // Run this code on ending of series
      // add remaining_supply of ito_series to ito_token remaining_supply on ending of series
      setTimeout(async () => {
        // if server get down on series end_date then what happend -- solution -- provide admin button to manually increase token supply and decrease series remaining to zero
        try {
          const seriesDetailing = (await ItoSeries.getSeriesById(series.id))
            .rows[0];
          const tokenDetailing = (
            await Token.getTokenByIto(seriesDetailing.ito_id)
          ).rows[0];

          let { remaining_supply } = tokenDetailing;
          remaining_supply += seriesDetailing.remaining_supply;

          await Token.updateToken(itoToken.id, {
            remaining_supply,
          });
        } catch (error) {
          console.log(error.message);
        }
      }, series.end_date - new Date());
      // send admin instant msg that series has been closed and 15(remaining_supply of series) remaining_supply have been sent back to itoToken remaining_supply
    }

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: `You ${req.body.status} this series successfully`,
      data: seriesUpdated.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, msg: error.message });
  }
};

const requestForUpdationOfSeriesSupply = async (req, res, next) => {
  try {
    let series = (await ItoSeries.getSeriesById(req.params.id)).rows[0];

    if (!series) {
      return res
        .status(404)
        .json({ success: false, msg: 'No series found to update' });
    }

    const ito = (await ITO.getITOById(series.ito_id)).rows[0];

    if (!ito) {
      return res
        .status(404)
        .json({ success: false, msg: `User ITO does not exist.` });
    }

    // restrict user who can update series
    // get alloted itos by ito id
    const allotedItos = (await AllotedItos.getAllotedITO(series.ito_id)).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot update series supply',
      });
    }

    if (series.update_request_userid) {
      return res.status(400).json({
        success: false,
        msg: `Please verify previous updation request first`,
      });
    }

    if (['rejected', 'pending'].includes(ito.status)) {
      return res.status(400).json({
        success: false,
        msg: `Cannot update supply on ${ito.status} ito`,
      });
    }

    if (ito.onhold || ito.closed) {
      return res.status(400).json({
        success: false,
        msg: `Cannot update supply with onhold or closed ito`,
      });
    }

    if (series.end_date < new Date()) {
      return res.status(400).json({
        success: false,
        msg: `Cannot update closed series`,
      });
    }

    const remaining_supply =
      Number(series.remaining_supply) + Number(req.body.new_supply);
    const supply = Number(series.supply) + Number(req.body.new_supply);

    if (remaining_supply < 0) {
      return res.status(400).json({
        success: false,
        msg: 'Series remaining supply cannot be less than 0',
      });
    }

    if (supply < 0) {
      return res.status(400).json({
        success: false,
        msg: 'Series total supply cannot be less than 0',
      });
    }

    const itoToken = (await Token.getTokenByIto(ito.id)).rows[0];

    let { remaining_supply: token_remaining_supply } = itoToken;

    if (token_remaining_supply < req.body.new_supply) {
      return res
        .status(400)
        .json({ success: false, msg: 'Insufficient token remaining supply' });
    }

    const seriesBody = { ...req.body };

    seriesBody.update_request_userid = req.user.id;
    // seriesBody.new_supply = req.body.new_supply;
    seriesBody.update_status = 'pending';
    seriesBody.updated_at = 'now()';

    await client.query('BEGIN');
    const seriesUpdated = await ItoSeries.updateSeries(
      seriesBody,
      series.id,
      Object.keys(series),
    );

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: 'Supply update request generated successfully',
      data: seriesUpdated.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(400).json({ success: false, msg: error.message });
  }
};

const verifySeriesSupplyUpdationRequest = async (req, res, next) => {
  try {
    if (
      !req.body.update_status ||
      !['approved', 'rejected'].includes(req.body.update_status)
    ) {
      return res.status(400).json({
        success: false,
        msg: 'Status can only be approved or rejected',
      });
    }

    let series = (await ItoSeries.getSeriesById(req.params.id)).rows[0];

    if (!series) {
      return res
        .status(404)
        .json({ success: false, msg: 'No series found to verify' });
    }

    if (!series.update_request_userid) {
      return res.status(404).json({
        success: false,
        msg: 'Please add updation request first',
      });
    }

    if (series.update_request_userid === req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'You generated updation request. Your cannot verify this',
      });
    }

    // get alloted itos by ito id other than who created updation request
    const allotedItos = (
      await AllotedItos.getAllotedITOToVerifyIto(
        series.ito_id,
        series.update_request_userid,
      )
    ).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot verify this Series.',
      });
    }

    if (['rejected', 'approved'].includes(series.update_status)) {
      return res
        .status(409)
        .json({ success: false, msg: 'Series already verified' });
    }

    if (series.end_date <= new Date()) {
      return res.status(400).json({
        success: false,
        msg: 'Cannot verify closed series',
      });
    }

    const remaining_supply =
      Number(series.remaining_supply) + Number(series.new_supply);
    const supply = Number(series.supply) + Number(series.new_supply);

    if (req.body.update_status === 'approved') {
      if (remaining_supply < 0) {
        return res.status(400).json({
          success: false,
          msg: 'Series remaining supply cannot be less than 0',
        });
      }

      if (supply < 0) {
        return res.status(400).json({
          success: false,
          msg: 'Series total supply cannot be less than 0',
        });
      }
    }

    const fields = {
      update_status: req.body.update_status,
      update_verify_userid: req.user.id,
      ...(req.body.update_status === 'approved' && {
        remaining_supply,
        supply,
      }),

      update_request_userid: null,
      new_supply: null,
    };

    await client.query('BEGIN');
    const seriesUpdated = await ItoSeries.updateSeries(
      fields,
      series.id,
      Object.keys(series),
    );

    // check if token remaining supply is not less than new_supply
    if (req.body.update_status === 'approved') {
      const itoToken = (await Token.getTokenByIto(series.ito_id)).rows[0];

      let { remaining_supply: token_remaining_supply } = itoToken;

      if (token_remaining_supply < series.new_supply) {
        return res.status(400).json({
          success: false,
          msg: 'Cannot verify - Insufficient token remaining supply',
        });
      }

      token_remaining_supply -= series.new_supply;

      await Token.updateToken(itoToken.id, {
        remaining_supply: token_remaining_supply,
      });
    }

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: `You ${req.body.update_status} updation request successfully`,
      data: seriesUpdated.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getSeriesList = async (req, res, next) => {
  try {
    const query = { ...req.query };
    let status = '';
    if (query.status) {
      delete req.query.status;
      if (query.status === 'ongoing') {
        status = `start_date <= now() AND end_date >= now()`;
      } else if (query.status === 'upcoming') {
        status = `start_date > now()`;
      } else if (query.status === 'closed') {
        // status = `end_date < ( now()::date + '1 day'::interval)`;
        status = `end_date < now()`;
      } else {
        return res.status(400).send({ success: false, msg: 'invalid status' });
      }
    }
    const series = await ItoSeries.getSeries(req.query, status);
    res.status(200).json({ success: true, data: series.rows });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const getSeriesById = async (req, res, next) => {
  try {
    const series = await ItoSeries.getSeriesById(req.params.id);
    res.status(200).json({ success: true, data: series.rows[0] || {} });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

//getDraftByUser
const getDraftByUser = async (req, res, next) => {
  try {
    console.log('Helllo World');
    //get all drafts by user
    const series = await ItoSeries.getDraftByUser(req.user.id);
    console.log(series.rows);

    //get all rejected series
    // const get_rejected = await ItoSeries.getRejectedSeries(req.user.id);
    // console.log('rejected series data ....', get_rejected.rows);

    // const new_array = [...series.rows, ...get_rejected.rows];
    res.status(200).json({ success: true, data: series.rows || {} });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

// getDraftByID
const getDraftByID = async (req, res, next) => {
  try {
    const series = await ItoSeries.getDraftByID(req.params.id);
    res.status(200).json({ success: true, data: series.rows || {} });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

// updateDraftByID
const updateDraftByID = async (req, res, next) => {
  try {
    console.log('Draft id is .....', req.params.id);
    if (!Object.keys(req.body).length) {
      return res
        .status(400)
        .json({ success: false, msg: 'No fields to update' });
    }

    const get_draft = await ItoSeries.getDraftByID(req.params.id);

    console.log('draft data ....', get_draft.rows[0]);
    if (!get_draft.rows.length) {
      return res
        .status(404)
        .json({ success: false, msg: `Draft not found to update` });
    }
    console.log('req.body data is .....', req.body);
    const fields = {
      user_id: req.user.id,
      ito_id: req.body.ito_id,
      series_name: req.body.name,
      description: req.body.description,
      supply: req.body.supply,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
    };
    //update draft
    const update_draft = await ItoSeries.update_draft(fields, req.params.id, [
      'id',
    ]);

    res.status(200).json({ success: true, msg: 'Draft Updated successfully ' });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

//createDraft
const createDraft = async (req, res, next) => {
  try {
    req.body.user_id = req.user.id;
    console.log('draft data is .....', req.body);
    const series = await ItoSeries.createDraft(req.body);
    res.status(200).json({ success: true, msg: 'Record saved as draft' });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};
const getItoOngoingSeries = async (req, res, next) => {
  try {
    const series = (await ItoSeries.findItoOngoingSeries(req.user.id)).rows;
    res.status(200).json({ success: true, data: series || [] });
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
};

const updateSeries = async (req, res, next) => {
  try {
    if (!Object.keys(req.body).length) {
      return res
        .status(400)
        .json({ success: false, msg: 'No fields to update' });
    }

    const series = await ItoSeries.getSeriesById(req.params.id);

    if (!series.rows.length) {
      return res.status(404).json({
        success: false,
        msg: `No series found with id ${req.params.id}`,
      });
    }

    // get alloted itos by ito id other than who created this series
    const allotedItos = (await AllotedItos.getAllotedITO(series.ito_id)).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot update this Series.',
      });
    }

    const seriesUpdated = await ItoSeries.updateSeries(
      req.body,
      req.params.id,
      ['id', 'name', 'status', 'description', 'start_date', 'end_date'],
    );

    res.status(200).json({
      success: true,
      msg: 'Series updated successfully',
      data: seriesUpdated.rows[0],
    });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const deleteSeries = async (req, res, next) => {
  try {
    const series = await ItoSeries.getSeriesById(req.params.id);

    if (!series.rows.length) {
      return res.status(400).json({
        success: false,
        msg: `no series found with id ${req.params.id}`,
      });
    }

    if (req.user.ito !== series.rows[0].ito_id) {
      return res.status(403).json({
        success: false,
        msg: "you don't have the right permission to access this resource :)",
      });
    }

    await ItoSeries.deleteSeries(req.params.id);
    res.status(200).json({ success: true, msg: 'series deleted successfully' });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const getSeriesByStatus = async (req, res, next) => {
  try {
    const { status, ito } = req.query;
    let result = null;
    if (status) {
      if (status === 'ongoing') {
        result = (await ItoSeries.findItoOngoingSeries(req.user.id)).rows;
      } else if (status === 'upcoming') {
        result = (await ItoSeries.findUpcomingSeries(req.user.id)).rows;
      } else if (status === 'closed') {
        result = (await ItoSeries.findClosedSeries(req.user.id)).rows;
      } else {
        result = [];
      }
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

const getStartAndEndTime = (start_date, end_date) => {
  const startDate = new Date(start_date);
  const currentDate = new Date(new Date().toISOString().slice(0, 10));
  const endDate = new Date(end_date);

  const startTime = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    startDate.getDate(),
  ).getTime();
  const currentTime = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  ).getTime();
  const endTime = new Date(
    endDate.getFullYear(),
    endDate.getMonth() + 1,
    endDate.getDate(),
  ).getTime();

  return [startTime, currentTime, endTime];
};

const getAllOngoingSeries = async (req, res, nex) => {
  try {
    let series = (await ItoSeries.findOngoingSeries()).rows;
    res.status(200).json({ success: true, data: series });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

module.exports = {
  createSeries,
  verifySeriesCreationRequest,
  requestForUpdationOfSeriesSupply,
  verifySeriesSupplyUpdationRequest,
  updateSeries,
  getSeriesList,
  getSeriesById,
  deleteSeries,
  getSeriesByStatus,
  getItoOngoingSeries,
  getAllOngoingSeries,
  createDraft,
  getDraftByUser,
  getDraftByID,
  updateDraftByID,
};

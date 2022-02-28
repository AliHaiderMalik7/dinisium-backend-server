const getStartAndEndTime = (start_date, end_date) => {
  const startDate = new Date(start_date);
  const currentDate = new Date(new Date().toISOString().slice(0, 10));
  const endDate = new Date(end_date);

  const startTime = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    startDate.getDate()
  ).getTime();
  const currentTime = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  ).getTime();
  const endTime = new Date(
    endDate.getFullYear(),
    endDate.getMonth() + 1,
    endDate.getDate()
  ).getTime();

  return [startTime, currentTime, endTime];
};

module.exports = { getStartAndEndTime };

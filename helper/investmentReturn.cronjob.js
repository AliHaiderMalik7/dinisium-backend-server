var cron = require("node-cron");
const client = require("../model/DB").pool;
const Subscription = require("../model/subscription");
const Wallet = require("../model/wallet");

module.exports = {
  investmentReturn() {
    // 0 */1 * * * “At minute 5 past every hour.”
    cron.schedule("* 5 * * *", async () => {
      try {
        const subscription = (
          await Subscription.findAllSubscriptions({ is_invt_revert: false })
        ).rows;

        console.log("Subscription are : ", subscription.length);

        if (!subscription) {
          return 0;
        }
        for (let i = 0; i < subscription.length; i++) {
          await client.query("BEGIN");
          // Fetching subscription again because previous one contains old subscription values
          const subscriptionDetail = (
            await Subscription.getSubscriptionByID(subscription[i].id)
          ).rows[0];
          if (
            subscriptionDetail.current > 0 &&
            subscriptionDetail.current < subscriptionDetail.threshold
          ) {
            const subscribers = (
              await Subscription.getAllSubscribers({
                subscription_id: subscription[i].id,
              })
            ).rows;

            for (let index = 0; index < subscribers.length; index++) {
              const subscriber = subscribers[index];
              const wallet = (
                await Wallet.getAllWallets({ user_id: subscriber.user_id })
              ).rows[0];

              const walletBody = {
                locked_amount:
                  Number(wallet.locked_amount) - Number(subscriber.investment),
                fiat_balances:
                  Number(wallet.fiat_balances) + Number(subscriber.investment),
              };
              const updatedWallet = await Wallet.updateWallet(
                wallet.id,
                walletBody
              );
            }

            await Subscription.updateSubscription(
              { is_invt_revert: true },
              subscription[i].id
            );
          }
          await client.query("COMMIT");
        }
        return 1;
      } catch (error) {
        await client.query("ROLLBACK");
        console.log(error);
      }
    });
  },
};

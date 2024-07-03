import * as functions from "firebase-functions";
import { App, ExpressReceiver, LogLevel } from "@slack/bolt";
import { REGION } from "../../lib/constants";
import { useMentionEvent } from "./events/useMentionEvent";
import { useSearchAction } from "./actions/useSearchAction";
import { useShowAddItemModalAction } from "./actions/useShowAddItemModalAction";
import { useAddItemView } from "./views/useAddItemView";
import { useAppDirectMessageEvent } from "./events/useAppDirectMessageEvent";
import { useAskAction } from "./actions/useAskAction";
import { error, info, warn } from "firebase-functions/lib/logger";
import { useReplyEvent } from "./events/useReplyEvent";
import { registerActionOrEvents } from "../../lib/registerActionOrEvents";

const config = functions.config();

const expressReceiver = new ExpressReceiver({
  signingSecret: config.slack.signin_secret,
  endpoints: "/events",
  processBeforeResponse: true,
});

const app = new App({
  receiver: expressReceiver,
  token: config.slack.bot_token,
  processBeforeResponse: true,
  logger: {
    error(...msg) {
      error(msg);
    },
    debug(...msg) {
      info(msg);
    },
    info(...msg) {
      info(msg);
    },
    warn(...msg) {
      warn(msg);
    },
    setLevel: (level) => ({}),
    getLevel: () => LogLevel.DEBUG,
    setName: (name) => ({}),
  },
});

app.error(async (e) => {
  error(e);
});

registerActionOrEvents(app, [
  [useMentionEvent, true],
  [useAppDirectMessageEvent, true],
  [useSearchAction, true],
  [useShowAddItemModalAction, true],
  [useAddItemView, true],
  [useAskAction, !!config.slack.ask_channel_id],
  [useReplyEvent, !!config.openai?.key],
])

export const slack = functions.region(REGION).https.onRequest((req, res) => {
  // イベントのタイムアウトでの再送を防止
  if (req.headers["x-slack-retry-num"] || req.headers["X-Slack-Retry-Num"]) {
    res.send(JSON.stringify({ message: "No need to resend" }));
    return;
  }
  expressReceiver.app(req, res);
});

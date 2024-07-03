import { App } from "@slack/bolt";
import { Configuration, OpenAIApi } from "openai";
import * as functions from "firebase-functions";
import { GPT_BOT_NAME } from "../../../lib/constants";

const config = functions.config();

const postAsGptBot = async ({
  client,
  channel,
  threadTs,
  text,
}: {
  client: any;
  channel: string;
  threadTs: string;
  text: string;
}) => {
  return await client.chat.postMessage({
    channel,
    thread_ts: threadTs,
    icon_emoji: ":robot_face:",
    username: GPT_BOT_NAME,
    text,
  });
}


export const useReplyEvent = (app: App) => {
  app.event("message", async ({ event, client, logger }) => {
    const { thread_ts: threadTs, bot_id: botId, text } = event as any;
    // botの返信またはスレッドのメッセージでなければ何もしない
    if (botId || !threadTs) {
      return;
    }

    // スレッドのメッセージを取得
    const threadMessagesResponse = await client.conversations.replies({
      channel: event.channel,
      ts: threadTs,
    });
    const messages = threadMessagesResponse.messages?.sort(
      (a, b) => Number(a.ts) - Number(b.ts)
    );

    // GPT Botへの返信でなければ何もしない
    if (!(messages![0].text?.includes(GPT_BOT_NAME) && messages![0].bot_id)) {
      return
    }

    try {
      // Slackのレスポンス制約を回避するために、仮のメッセージを投稿する
      const thinkingMessageResponse = await postAsGptBot({
        client,
        channel: event.channel,
        threadTs,
        text: "...",
      });

    // 会話の履歴を取得して結合。最大6件まで
    const prevMessages =
      messages!.length < 6
        ? messages!.slice(1, -1)
        : messages!.slice(-6, -1);
    const prevMessageText =
      prevMessages.map((m, i) => {
        m.bot_id ? `${i+1}. you: ${m.text}` : `${i+1}. I: ${m.text}`
        return `${i+1}. ${m.text}`
      }).join("\n") || ""


      // 回答メッセージの作成 with OpenAI
      const prompt = `
You are an excellent AI. Please answer the current question based on your knowledge and our previous conversations.

# Previous conversations:
${prevMessageText}

# Current question:
${text}

# Answer:
`;
      const configuration = new Configuration({
        apiKey: config.openai.key,
      });
      const openAIClient = new OpenAIApi(configuration);
      const completions = await openAIClient.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
      });
      const message = completions.data.choices[0].text;

      // 仮のメッセージを削除する
      await client.chat.delete({
        channel: event.channel,
        ts: thinkingMessageResponse.ts!,
      });

      // 回答メッセージを投稿する
      if (message) {
        await postAsGptBot({
          client,
          channel: event.channel,
          threadTs,
          text: message,
        });
      } else {
        throw new Error("message is empty");
      }
    } catch (e) {
      logger.error(e);
      await postAsGptBot({
        client,
        channel: event.channel,
        threadTs,
        text: "大変申し訳ございません。エラーです。別スレッドでやり直してください。",
      });
    }
  });
};

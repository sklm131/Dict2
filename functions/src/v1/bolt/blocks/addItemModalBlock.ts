import { Block, KnownBlock } from "@slack/bolt";

export const addItemModalBlock = (
  searchWord: string
): (Block | KnownBlock)[] => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "気軽に追加してね。間違っていたら誰かが修正してくれるはず。\n社外㊙はNGだよ、URLはSpaceFinderの「データツリーを開くURLの取得」から取得してね",
      },
    },
    {
      type: "input",
      block_id: "word",
      label: {
        type: "plain_text",
        text: "用語",
      },
      element: {
        type: "plain_text_input",
        action_id: "word_input",
        initial_value: searchWord,
      },
    },
    {
      type: "input",
      block_id: "description",
      label: {
        type: "plain_text",
        text: "説明",
      },
      element: {
        type: "plain_text_input",
        action_id: "description_input",
        multiline: true,
      },
    },
    {
      type: "input",
      block_id: "link",
      label: {
        type: "plain_text",
        text: "情報ソースのURL ※任意",
      },
      element: {
        type: "plain_text_input",
        action_id: "link_input",
      },
    },
  ];
};

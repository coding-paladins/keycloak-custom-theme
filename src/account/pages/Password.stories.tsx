import type { Meta, StoryObj } from "@storybook/react-vite";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "password.ftl" });

const meta = {
  title: "account/password.ftl",
  component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <KcPageStory />
};

export const WithMessage: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        message: { type: "success", summary: "This is a test message" }
      }}
    />
  )
};

export const FirstTimePasswordSetup: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        account: { username: "john_doe" },
        password: { passwordSet: false },
        url: { passwordUrl: "/password" },
        stateChecker: "state-checker"
      }}
    />
  )
};

export const IncorrectCurrentPassword: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        message: { type: "error", summary: "Incorrect current password." },
        account: { username: "john_doe" },
        password: { passwordSet: true },
        url: { passwordUrl: "/password" },
        stateChecker: "state-checker"
      }}
    />
  )
};

export const SubmissionSuccessWithRedirect: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        message: {
          type: "success",
          summary: "Password successfully changed."
        },
        account: { username: "john_doe" },
        password: { passwordSet: true },
        url: { passwordUrl: "/password" },
        stateChecker: "state-checker"
      }}
    />
  )
};

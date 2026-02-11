import type { Meta, StoryObj } from "@storybook/react-vite";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "federatedIdentity.ftl" });

const meta = {
  title: "account/federatedIdentity.ftl",
  component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <KcPageStory />
};

export const NotConnected: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        federatedIdentity: {
          identities: [
            {
              providerId: "google",
              displayName: "keycloak-oidc",
              connected: false
            }
          ],
          removeLinkPossible: true
        }
      }}
    />
  )
};

export const RemoveLinkNotPossible: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        federatedIdentity: {
          identities: [
            {
              providerId: "google",
              displayName: "Google",
              userName: "john.doe@gmail.com",
              connected: true
            }
          ],
          removeLinkPossible: false
        },
        stateChecker: "1234",
        url: { socialUrl: "/social" }
      }}
    />
  )
};

export const AddLinkForUnconnectedIdentity: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        federatedIdentity: {
          identities: [
            {
              providerId: "github",
              displayName: "GitHub",
              userName: "",
              connected: false
            }
          ],
          removeLinkPossible: true
        },
        stateChecker: "1234",
        url: { socialUrl: "/social" }
      }}
    />
  )
};

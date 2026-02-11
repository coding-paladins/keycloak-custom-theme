import type { Meta, StoryObj } from "@storybook/react-vite";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "log.ftl" });

const meta = {
  title: "account/log.ftl",
  component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <KcPageStory />
};

export const LogsMissingDetails: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        log: {
          events: [
            {
              date: "2024-04-26T12:29:08Z",
              ipAddress: "127.0.0.1",
              client: "",
              details: [],
              event: "login"
            }
          ]
        }
      }}
    />
  )
};

export const SingleLogEntry: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        log: {
          events: [
            {
              date: "2024-04-26T12:29:08Z",
              ipAddress: "127.0.0.1",
              client: "keycloakify-frontend",
              details: [
                { key: "auth_method", value: "openid-connect" },
                { key: "username", value: "john.doe" }
              ],
              event: "login"
            }
          ]
        }
      }}
    />
  )
};

export const LogsWithLongDetails: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        log: {
          events: [
            {
              date: "2024-04-26T12:29:08Z",
              ipAddress: "127.0.0.1",
              client: "keycloakify-frontend",
              details: [
                { key: "auth_method", value: "openid-connect" },
                { key: "username", value: "john.doe" },
                {
                  key: "session_duration",
                  value: "2 hours 30 minutes 45 seconds"
                },
                { key: "location", value: "Windsor, Ontario, Canada" },
                {
                  key: "user_agent",
                  value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                }
              ],
              event: "login"
            }
          ]
        }
      }}
    />
  )
};

export const EmptyClientField: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        log: {
          events: [
            {
              date: "2024-04-26T12:29:08Z",
              ipAddress: "127.0.0.1",
              client: "",
              details: [
                { key: "auth_method", value: "openid-connect" },
                { key: "username", value: "john.doe" }
              ],
              event: "login"
            }
          ]
        }
      }}
    />
  )
};

export const NoLogsAvailable: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        log: { events: [] }
      }}
    />
  )
};

function generateManyLogEvents(count: number) {
  const events = ["login", "logout", "logout_error", "register", "code_to_token"];
  const clients = ["keycloakify-frontend", "security-admin-console", "account-console", ""];
  const ips = ["127.0.0.1", "192.168.1.100", "10.0.0.5", "172.16.0.1"];
  const baseDate = new Date("2024-04-26T12:00:00Z");

  return Array.from({ length: count }, (_, i) => ({
    date: new Date(baseDate.getTime() - i * 3600000).toISOString(),
    event: events[i % events.length],
    ipAddress: ips[i % ips.length],
    client: clients[i % clients.length],
    details:
      i % 3 === 0
        ? [
            { key: "auth_method", value: "openid-connect" },
            { key: "username", value: "john.doe" }
          ]
        : i % 3 === 1
          ? [{ key: "session_id", value: `session-${i}` }]
          : []
  }));
}

export const ManyLogs: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        log: {
          events: generateManyLogEvents(25)
        }
      }}
    />
  )
};

export const VeryLongClientAndEventNames: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        log: {
          events: [
            {
              date: "2024-04-26T12:29:08Z",
              ipAddress: "127.0.0.1",
              client: "very-long-application-client-name-for-testing-overflow-behavior-in-ui",
              details: [
                { key: "auth_method", value: "openid-connect" },
                { key: "username", value: "john.doe" }
              ],
              event: "federated_identity_first_login"
            },
            {
              date: "2024-04-26T11:00:00Z",
              ipAddress: "192.168.1.100",
              client: "security-admin-console-with-extremely-long-identifier-for-testing",
              details: [],
              event: "identity_provider_first_login"
            }
          ]
        }
      }}
    />
  )
};

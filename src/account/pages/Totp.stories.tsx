import type { Meta, StoryObj } from "@storybook/react-vite";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "totp.ftl" });

const meta = {
  title: "account/totp.ftl",
  component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        mockPasskeys: [],
        mockPasskeysLoading: false
      }}
    />
  )
};

export const WithTotpEnabled: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        totp: {
          enabled: true,
          totpSecretEncoded: "G55E MZKC JFUD MQLT MFIF EVSB JFLG M6SO",
          totpSecret: "7zFeBIh6AsaPRVAIVfzN",
          otpCredentials: [{ id: "7afaaf7d-f2d5-44f5-a966-e5297f0b2b7a", userLabel: "mobile" }]
        },
        message: {
          summary: "Mobile authenticator configured.",
          type: "success"
        },
        mockPasskeys: [],
        mockPasskeysLoading: false
      }}
    />
  )
};

export const WithQrCodeSetup: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        mode: "qr",
        totp: {
          enabled: false,
          totpSecretEncoded: "KZ5H CYTW GBVV ASDE JRXG MMCK HAZU E6TX",
          totpSecret: "Vzqbv0kPHdLnf0J83Bzw",
          totpSecretQrCode:
            "iVBORw0KGgoAAAANSUhEUgAAAPYAAAD2AQAAAADNaUdlAAACM0lEQVR4Xu3OIZJgOQwDUDFd2UxiurLAVnnbHw4YGDKtSiWOn4Gxf81//7r/+q8b4HfLGBZDK9d85NmNR+sB42sXvOYrN5P1DcgYYFTGfOlbzE8gzwy3euweGizw7cfdl34/GRhlkxjKNV+5AebPXPORX1JuB9x8ZfbyyD2y1krWAKsbMq1HnqQDaLfa77p4+MqvzEGSqvSAD/2IHW2yHaigR9tX3m8dDIYGcNf3f+gDpVBZbZU77zyJ6Rlcy+qoTMG887KAPD9hsh6a1Sv3gJUHGHUAxSMzj7zqDDe7Phmt2eG+8UsMxjRGm816MAO+8VMl1R1jGHOrZB/5Zo/WXAPgxixm9Mo96vDGrM1eOto8c4Ax4wF437mifOXlpiPzCnN7Y9l95NnEMxgMY9AAGA8fucH14Y1aVb6N/cqrmyh0BVht7k1e+bU8LK0Cg5vmVq9c5vHIjOfqxDIfeTraNVTwewa4wVe+SW5N+uP1qACeudUZbqGOfA6VZV750Noq2Xx3kpveV44ZelSV1V7KFHzkWyVrrlUwG0Pl9pWnoy3vsQoME6vKI69i5osVgwWzHT7zjmJtMcNUSVn1oYMd7ZodbgowZl45VG0uVuLPUr1yc79uaQBag/mqR34xhlWyHm1prplHboCWdZ4TeZjsK8+dI+jbz1C5hl65mcpgB5dhcj8+dGO+0Ko68+lD37JDD83dpDLzzK+TrQyaVwGj6pUboGV+7+AyN8An/pf84/7rv/4/1l4OCc/1BYMAAAAASUVORK5CYII=",
          qrUrl: "#",
          manualUrl: "#",
          otpCredentials: [],
          supportedApplications: ["totpAppFreeOTPName", "totpAppMicrosoftAuthenticatorName", "totpAppGoogleName"],
          policy: {
            algorithm: "HmacSHA1",
            digits: 6,
            lookAheadWindow: 1,
            type: "totp",
            period: 30,
            getAlgorithmKey: () => "SHA1"
          }
        },
        mockPasskeys: [],
        mockPasskeysLoading: false
      }}
    />
  )
};

export const WithManualMode: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        mode: "manual",
        totp: {
          enabled: false,
          totpSecretEncoded: "KZ5H CYTW GBVV ASDE JRXG MMCK HAZU E6TX",
          totpSecret: "Vzqbv0kPHdLnf0J83Bzw",
          otpCredentials: []
        },
        mockPasskeys: [],
        mockPasskeysLoading: false
      }}
    />
  )
};

export const MoreThanOneTotpProviders: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        totp: {
          enabled: true,
          totpSecretEncoded: "G55E MZKC JFUD MQLT MFIF EVSB JFLG M6SO",
          totpSecret: "7zFeBIh6AsaPRVAIVfzN",
          otpCredentials: [
            { id: "1", userLabel: "Samsung S23" },
            { id: "2", userLabel: "Apple Iphone 15" }
          ]
        },
        mockPasskeys: [],
        mockPasskeysLoading: false
      }}
    />
  )
};

export const TotpEnabledNoOtpCredentials: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        totp: {
          enabled: true,
          totpSecretEncoded: "HE4W MSTC OBKU CY2M",
          otpCredentials: []
        },
        stateChecker: "stateChecker123",
        url: { totpUrl: "http://localhost:8080/realms/myrealm/account/totp" },
        mockPasskeys: [],
        mockPasskeysLoading: false
      }}
    />
  )
};

export const ManualModeTotp: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        mode: "manual",
        totp: {
          enabled: false,
          totpSecretEncoded: "HE4W MSTC OBKU CY2M",
          otpCredentials: []
        },
        stateChecker: "stateChecker123",
        url: { totpUrl: "http://localhost:8080/realms/myrealm/account/totp" },
        mockPasskeys: [],
        mockPasskeysLoading: false
      }}
    />
  )
};

export const MultipleOtpDevices: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        totp: {
          enabled: true,
          totpSecretEncoded: "G55E MZKC JFUD",
          otpCredentials: [
            { id: "1", userLabel: "Phone 1" },
            { id: "2", userLabel: "Tablet" }
          ]
        },
        stateChecker: "stateChecker123",
        url: { totpUrl: "http://localhost:8080/realms/myrealm/account/totp" },
        mockPasskeys: [],
        mockPasskeysLoading: false
      }}
    />
  )
};

export const NoPasskeys: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        totp: {
          enabled: false,
          totpSecretEncoded: "HE4W MSTC OBKU CY2M",
          totpSecret: "Vzqbv0kPHdLnf0J83Bzw",
          otpCredentials: []
        },
        mockPasskeys: [],
        mockPasskeysLoading: false
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Totp page with no passkeys. Shows add passkey button and empty state."
      }
    }
  }
};

export const OnePasskey: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        totp: {
          enabled: false,
          totpSecretEncoded: "HE4W MSTC OBKU CY2M",
          otpCredentials: []
        },
        mockPasskeys: [
          {
            id: "cred-abc123",
            userLabel: "1Password",
            createdAt: new Date("2026-02-10T22:13:00").getTime(),
            provider: "1Password",
            transports: "internal, hybrid"
          }
        ],
        mockPasskeysLoading: false
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Totp page with one registered passkey."
      }
    }
  }
};

export const ThreePasskeys: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        totp: {
          enabled: false,
          totpSecretEncoded: "HE4W MSTC OBKU CY2M",
          otpCredentials: []
        },
        mockPasskeys: [
          {
            id: "cred-abc123",
            userLabel: "1Password",
            createdAt: new Date("2026-02-10T22:13:00").getTime(),
            provider: "1Password",
            transports: "internal, hybrid"
          },
          {
            id: "cred-def456",
            userLabel: "iPhone 15",
            createdAt: new Date("2026-01-15T10:00:00").getTime(),
            provider: "iCloud Keychain",
            transports: "internal"
          },
          {
            id: "cred-ghi789",
            userLabel: "YubiKey",
            createdAt: new Date("2025-12-01T14:30:00").getTime(),
            provider: "YubiKey",
            transports: "usb, nfc"
          }
        ],
        mockPasskeysLoading: false
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Totp page with three registered passkeys."
      }
    }
  }
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "account.ftl" });

const meta = {
  title: "account/account.ftl",
  component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <KcPageStory />
};

export const UsernameNotEditable: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        account: {
          username: "john_doe",
          email: "john.doe@gmail.com",
          firstName: "John",
          lastName: "Doe"
        },
        realm: {
          registrationEmailAsUsername: false,
          editUsernameAllowed: false
        },
        referrer: { url: "/home", name: "Home" },
        url: { accountUrl: "/account" },
        messagesPerField: { printIfExists: () => "" },
        stateChecker: "state-checker"
      }}
    />
  )
};

export const WithValidationErrors: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        account: {
          username: "john_doe",
          email: "",
          firstName: "",
          lastName: "Doe"
        },
        realm: {
          registrationEmailAsUsername: false,
          editUsernameAllowed: true
        },
        referrer: { url: "/home", name: "Home" },
        url: { accountUrl: "/account" },
        messagesPerField: {
          printIfExists: (field: string) => (field === "email" || field === "firstName" ? "has-error" : ""),
          existsError: (field: string) => field === "email" || field === "firstName",
          get: (field: string) => (field === "email" ? "Please specify email." : field === "firstName" ? "Please specify first name." : ""),
          exists: (field: string) => field === "email" || field === "firstName"
        },
        stateChecker: "state-checker"
      }}
    />
  )
};

export const EmailAsUsername: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        account: {
          email: "john.doe@gmail.com",
          firstName: "John",
          lastName: "Doe"
        },
        realm: { registrationEmailAsUsername: true },
        referrer: { url: "/home", name: "Home" },
        url: { accountUrl: "/account" },
        messagesPerField: { printIfExists: () => "" },
        stateChecker: "state-checker"
      }}
    />
  )
};

const baseAccountContext = {
  account: {
    username: "john_doe",
    email: "john.doe@gmail.com",
    firstName: "John",
    lastName: "Doe"
  },
  realm: {
    registrationEmailAsUsername: false,
    editUsernameAllowed: true
  },
  referrer: { url: "/home", name: "Home" },
  url: { accountUrl: "/account" },
  messagesPerField: {
    printIfExists: () => "",
    existsError: () => false,
    get: () => "",
    exists: () => false
  },
  stateChecker: "state-checker"
};

const baseAttributes = {
  username: {
    name: "username",
    displayName: "${username}",
    required: true,
    value: "john_doe",
    readOnly: false,
    validators: {},
    annotations: {},
    html5DataAnnotations: {}
  },
  email: {
    name: "email",
    displayName: "${email}",
    required: true,
    value: "john.doe@gmail.com",
    readOnly: false,
    validators: {},
    annotations: { inputType: "html5-email" },
    html5DataAnnotations: {}
  },
  firstName: {
    name: "firstName",
    displayName: "${firstName}",
    required: true,
    value: "John",
    readOnly: false,
    validators: {},
    annotations: {},
    html5DataAnnotations: {}
  },
  lastName: {
    name: "lastName",
    displayName: "${lastName}",
    required: true,
    value: "Doe",
    readOnly: false,
    validators: {},
    annotations: {},
    html5DataAnnotations: {}
  }
};

export const WithCustomAttributes: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        ...baseAccountContext,
        profile: {
          attributesByName: {
            ...baseAttributes,
            phoneNumber: {
              name: "phoneNumber",
              displayName: "Phone number",
              required: false,
              value: "+1234567890",
              readOnly: false,
              validators: {},
              annotations: { inputType: "html5-tel" },
              html5DataAnnotations: {}
            },
            gender: {
              name: "gender",
              displayName: "Gender",
              required: false,
              value: "male",
              readOnly: false,
              validators: { options: { options: ["male", "female", "other"] } },
              annotations: {
                inputType: "select-radiobuttons",
                inputOptionLabels: { male: "Male", female: "Female", other: "Other" }
              },
              html5DataAnnotations: {}
            },
            bio: {
              name: "bio",
              displayName: "Bio",
              required: false,
              value: "Software developer",
              readOnly: false,
              validators: {},
              annotations: { inputType: "textarea", inputTypeRows: "3" },
              html5DataAnnotations: {}
            }
          }
        }
      }}
    />
  )
};

export const WithManyFields: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        ...baseAccountContext,
        profile: {
          attributesByName: {
            ...baseAttributes,
            phoneNumber: {
              name: "phoneNumber",
              displayName: "Phone number",
              required: false,
              value: "+1234567890",
              readOnly: false,
              validators: {},
              annotations: { inputType: "html5-tel" },
              html5DataAnnotations: {}
            },
            gender: {
              name: "gender",
              displayName: "Gender",
              required: false,
              value: "male",
              readOnly: false,
              validators: { options: { options: ["male", "female", "other"] } },
              annotations: {
                inputType: "select-radiobuttons",
                inputOptionLabels: { male: "Male", female: "Female", other: "Other" }
              },
              html5DataAnnotations: {}
            },
            bio: {
              name: "bio",
              displayName: "Bio",
              required: false,
              value: "Software developer",
              readOnly: false,
              validators: {},
              annotations: { inputType: "textarea", inputTypeRows: "3" },
              html5DataAnnotations: {}
            },
            department: {
              name: "department",
              displayName: "Department",
              required: false,
              value: "engineering",
              readOnly: false,
              validators: { options: { options: ["engineering", "sales", "support", "hr"] } },
              annotations: {
                inputType: "select",
                inputOptionLabels: {
                  engineering: "Engineering",
                  sales: "Sales",
                  support: "Support",
                  hr: "Human Resources"
                }
              },
              html5DataAnnotations: {}
            },
            website: {
              name: "website",
              displayName: "Website",
              required: false,
              value: "https://example.com",
              readOnly: false,
              validators: {},
              annotations: { inputType: "html5-url" },
              html5DataAnnotations: {}
            },
            dateOfBirth: {
              name: "dateOfBirth",
              displayName: "Date of birth",
              required: false,
              value: "1990-05-15",
              readOnly: false,
              validators: {},
              annotations: { inputType: "html5-date" },
              html5DataAnnotations: {}
            },
            newsletter: {
              name: "newsletter",
              displayName: "Newsletter",
              required: false,
              value: "yes",
              readOnly: false,
              validators: { options: { options: ["yes", "no"] } },
              annotations: {
                inputType: "select-radiobuttons",
                inputOptionLabels: { yes: "Subscribe to newsletter", no: "No thanks" }
              },
              html5DataAnnotations: {}
            },
            address: {
              name: "address",
              displayName: "Address",
              required: false,
              value: "123 Main St, City, Country",
              readOnly: false,
              validators: {},
              annotations: {
                inputType: "textarea",
                inputTypeRows: "2",
                inputHelperTextBefore: "Enter your full mailing address"
              },
              html5DataAnnotations: {}
            }
          }
        }
      }}
    />
  )
};

export const WithSelectDropdown: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        ...baseAccountContext,
        profile: {
          attributesByName: {
            ...baseAttributes,
            country: {
              name: "country",
              displayName: "Country",
              required: false,
              value: "us",
              readOnly: false,
              validators: { options: { options: ["us", "uk", "de", "fr"] } },
              annotations: {
                inputType: "select",
                inputOptionLabels: {
                  us: "United States",
                  uk: "United Kingdom",
                  de: "Germany",
                  fr: "France"
                }
              },
              html5DataAnnotations: {}
            },
            timezone: {
              name: "timezone",
              displayName: "Timezone",
              required: false,
              value: "America/New_York",
              readOnly: false,
              validators: {
                options: {
                  options: ["America/New_York", "Europe/London", "Europe/Berlin", "Asia/Tokyo"]
                }
              },
              annotations: {
                inputType: "select",
                inputOptionLabels: {
                  "America/New_York": "Eastern Time",
                  "Europe/London": "London",
                  "Europe/Berlin": "Berlin",
                  "Asia/Tokyo": "Tokyo"
                }
              },
              html5DataAnnotations: {}
            }
          }
        }
      }}
    />
  )
};

export const WithHelperText: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        ...baseAccountContext,
        profile: {
          attributesByName: {
            ...baseAttributes,
            email: {
              ...baseAttributes.email,
              annotations: {
                inputType: "html5-email",
                inputHelperTextAfter: "We will send verification emails to this address"
              }
            },
            bio: {
              name: "bio",
              displayName: "Bio",
              required: false,
              value: "",
              readOnly: false,
              validators: {},
              annotations: {
                inputType: "textarea",
                inputTypeRows: "4",
                inputHelperTextBefore: "Tell us a bit about yourself",
                inputHelperTextAfter: "Maximum 500 characters"
              },
              html5DataAnnotations: {}
            }
          }
        }
      }}
    />
  )
};

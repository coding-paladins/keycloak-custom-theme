import type { DeepPartial } from "keycloakify/tools/DeepPartial";
import type { KcContext } from "./KcContext";
import { createGetKcContextMock } from "keycloakify/account/KcContext";
import type { KcContextExtension, KcContextExtensionPerPage } from "./KcContext";
import KcPage from "./KcPage";
import { themeNames, kcEnvDefaults } from "../kc.gen";

const kcContextExtension: KcContextExtension = {
  themeName: themeNames[0],
  properties: {
    ...kcEnvDefaults
  }
};

const accountBaseProfile = {
  profile: {
    attributesByName: {
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
    }
  }
};

const kcContextExtensionPerPage: KcContextExtensionPerPage = {
  "account.ftl": accountBaseProfile,
  "totp.ftl": {}
};

const accountMessageFallbacks: Record<string, string> = {
  deleteAccountConfirm: "Delete account confirmation",
  addValue: "Add value",
  remove: "Remove"
};

export const { getKcContextMock } = createGetKcContextMock({
  kcContextExtension,
  kcContextExtensionPerPage,
  overrides: {
    referrer: undefined,
    locale: { currentLanguageTag: "en" },
    "x-keycloakify": {
      messages: accountMessageFallbacks
    }
  },
  overridesPerPage: {
    "account.ftl": accountBaseProfile
  }
});

export function createKcPageStory<PageId extends KcContext["pageId"]>(params: {
  pageId: PageId;
}) {
  const { pageId } = params;

  function KcPageStory(props: {
    kcContext?: DeepPartial<Extract<KcContext, { pageId: PageId }>>;
  }) {
    const { kcContext: overrides } = props;

    const kcContextMock = getKcContextMock({
      pageId,
      overrides
    });

    return <KcPage kcContext={kcContextMock} />;
  }

  return { KcPageStory };
}

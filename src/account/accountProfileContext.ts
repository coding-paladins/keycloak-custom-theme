import type { Attribute } from "keycloakify/login/KcContext";
import type { KcContext } from "./KcContext";

type AccountContext = Extract<KcContext, { pageId: "account.ftl" }>;

type UserProfileAttributeMetadata = {
  name: string;
  displayName?: string;
  required?: boolean | { roles?: string[] };
  requirements?: { always?: boolean; roles?: string[]; scopes?: string[] };
  readOnly?: boolean;
  group?: string;
  annotations?: Record<string, unknown>;
  validators?: Record<string, Record<string, unknown>>;
  validations?: Record<string, Record<string, unknown>>;
  multivalued?: boolean;
  defaultValue?: string;
};

type UserProfileMetadata = {
  attributes?: UserProfileAttributeMetadata[];
  groups?: Array<{ name: string; displayHeader?: string; displayDescription?: string }>;
};

function attributeToDisplayName(name: string): string {
  return `\${profile.attributes.${name}}`;
}

function isRequired(
  required: UserProfileAttributeMetadata["required"],
  requirements: UserProfileAttributeMetadata["requirements"]
): boolean {
  if (required !== undefined) {
    if (typeof required === "boolean") return required;
    if (required.roles?.includes("user") || required.roles?.includes("admin"))
      return true;
  }
  if (requirements !== undefined) {
    if (requirements.always === true) return true;
    if (requirements.roles?.includes("user") || requirements.roles?.includes("admin"))
      return true;
  }
  return false;
}

function metadataToAttribute(
  meta: UserProfileAttributeMetadata,
  value: string | string[],
  _realm: AccountContext["realm"],
  groups: UserProfileMetadata["groups"]
): Attribute {
  const annotations: Attribute["annotations"] =
    (meta.annotations as Attribute["annotations"]) ?? {};
  const validators = (meta.validators ??
    meta.validations ??
    {}) as Attribute["validators"];
  const optionsValidator = validators.options as { options?: string[] } | undefined;
  if (optionsValidator?.options && annotations.inputType === undefined) {
    annotations.inputType = "select";
  }
  const groupName = meta.group ?? "";
  const groupMeta = groups?.find(g => g.name === groupName);

  const isMultivalued = meta.multivalued === true;
  const values: string[] = Array.isArray(value)
    ? value.map(v => String(v ?? ""))
    : [String(value ?? "")];

  return {
    name: meta.name,
    displayName: meta.displayName ?? attributeToDisplayName(meta.name),
    required: isRequired(meta.required, meta.requirements),
    ...(isMultivalued ? { values } : { value: values[0] ?? "" }),
    html5DataAnnotations: {},
    readOnly: meta.readOnly ?? false,
    validators,
    annotations,
    multivalued: meta.multivalued,
    autocomplete: (meta.annotations as { autocomplete?: string } | undefined)
      ?.autocomplete,
    ...(groupName && groupMeta
      ? {
          group: {
            name: groupName,
            displayHeader: groupMeta.displayHeader,
            displayDescription: groupMeta.displayDescription,
            annotations: {},
            html5DataAnnotations: {}
          }
        }
      : {})
  } as Attribute;
}

function getUserValue(
  accountRecord: Record<string, unknown>,
  name: string
): string | string[] {
  const v =
    accountRecord[name] ??
    (accountRecord.attributes as Record<string, string[] | string> | undefined)?.[name];
  if (v === undefined) return "";
  return Array.isArray(v) ? v.map(item => String(item ?? "")) : String(v);
}

type AccountContextWithProfile = AccountContext & {
  profile?: { attributesByName?: Record<string, Attribute> };
};

/**
 * Builds a kcContext-like object compatible with useUserProfileForm.
 * Uses apiResponse.userProfileMetadata when available (from API fetch).
 * Falls back to kcContext.profile when provided (e.g. server-rendered or Storybook).
 */
export function buildAccountProfileContext(
  kcContext: AccountContextWithProfile,
  apiResponse?: { userProfileMetadata?: UserProfileMetadata } & Record<string, unknown>
): AccountContext & {
  profile: { attributesByName: Record<string, Attribute> };
  user?: {
    editUsernameAllowed: boolean;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
} {
  const { account, realm } = kcContext;
  const accountRecord = (
    apiResponse
      ? {
          ...account,
          ...apiResponse,
          attributes:
            (apiResponse.attributes as Record<string, string[] | string>) ??
            (account as Record<string, unknown>).attributes
        }
      : account
  ) as Record<string, unknown>;
  const metadata = apiResponse?.userProfileMetadata;
  const attributesByName: Record<string, Attribute> = {};

  if (metadata?.attributes && metadata.attributes.length > 0) {
    for (const meta of metadata.attributes) {
      if (meta.name === "username" && realm.registrationEmailAsUsername) continue;
      const value = getUserValue(accountRecord, meta.name);
      attributesByName[meta.name] = metadataToAttribute(
        meta,
        value,
        realm,
        metadata.groups
      );
    }
  } else if (
    kcContext.profile?.attributesByName &&
    Object.keys(kcContext.profile.attributesByName).length > 0
  ) {
    Object.assign(attributesByName, kcContext.profile.attributesByName);
  }

  return {
    ...kcContext,
    profile: { attributesByName }
  };
}

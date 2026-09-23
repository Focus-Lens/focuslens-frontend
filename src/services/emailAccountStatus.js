const availabilityKeys = ["available", "isAvailable", "exists", "emailExists"];

export function getEmailAvailability(result) {
  if (!result || typeof result !== "object") return undefined;

  for (const key of availabilityKeys) {
    if (typeof result[key] !== "boolean") continue;
    return key === "exists" || key === "emailExists"
      ? !result[key]
      : result[key];
  }

  return undefined;
}

export function isStudentEmailResult(result) {
  if (!result || typeof result !== "object") return false;

  if ([result.isStudent, result.isChild, result.isStudentAccount, result.isChildAccount]
    .some((value) => value === true)) {
    return true;
  }

  const accountTypes = [
    result.accountType,
    result.userType,
    result.accountRole,
    result.role,
    result.roles,
    result.user?.accountType,
    result.user?.userType,
    result.user?.role,
    result.user?.roles,
  ].flat(Infinity);

  return accountTypes.some((value) =>
    typeof value === "string" && /^(student|child|studentaccount|childaccount)$/i.test(value.trim()),
  );
}

export function isStudentEmailError(error) {
  const values = [
    error?.code,
    error?.message,
    error?.details?.code,
    error?.details?.type,
    error?.details?.title,
    error?.details?.detail,
  ];

  return values.some((value) =>
    typeof value === "string" && /student|child account|child email/i.test(value),
  );
}

export function isEmailNotFoundError(error) {
  const values = [
    error?.code,
    error?.message,
    error?.details?.code,
    error?.details?.title,
    error?.details?.detail,
  ];

  return values.some((value) =>
    typeof value === "string" && /email.{0,24}(not found|does not exist|unknown)|(?:account|user).{0,24}(not found|does not exist)/i.test(value),
  );
}

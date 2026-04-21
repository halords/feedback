const hasGlobalAccess = (user) => 
  user.user_type?.toLowerCase() === 'superadmin';

function resolveAuthorizedOffices(user, requestedOffices) {
  const requested = typeof requestedOffices === 'string' ? [requestedOffices] : requestedOffices;

  if (hasGlobalAccess(user)) {
    if (requested && requested.length > 0) return requested;
    return ["ALL"];
  }

  const userOffices = user.offices || [];

  if (user.is_analytics_enabled) {
    if (!requested || requested.length === 0 || (requested.length === 1 && requested[0] === "ALL")) {
      return ["ALL"];
    }
    return requested.filter(office => userOffices.includes(office));
  }

  if (!requested || requested.length === 0 || (requested.length === 1 && requested[0] === "ALL")) {
    return userOffices;
  }

  return requested.filter(office => userOffices.includes(office));
}

const tests = [
  {
    name: "Superadmin Global Default",
    user: { user_type: "superadmin" },
    requested: undefined,
    expected: ["ALL"]
  },
  {
    name: "Superadmin Specific Request",
    user: { user_type: "superadmin" },
    requested: ["PTO"],
    expected: ["PTO"]
  },
  {
    name: "Office Admin Default",
    user: { user_type: "officeadmin", offices: ["PTO"] },
    requested: undefined,
    expected: ["PTO"]
  },
  {
    name: "Office Admin Access Unauthorized",
    user: { user_type: "officeadmin", offices: ["PTO"] },
    requested: ["PHO"],
    expected: []
  },
  {
    name: "Office Admin Access Intersection",
    user: { user_type: "officeadmin", offices: ["PTO", "PHO"] },
    requested: ["PTO"],
    expected: ["PTO"]
  },
  {
    name: "Analytics Enabled Admin Global",
    user: { user_type: "officeadmin", offices: ["PTO"], is_analytics_enabled: true },
    requested: "ALL",
    expected: ["ALL"]
  }
];

let failures = 0;
tests.forEach(t => {
  const result = resolveAuthorizedOffices(t.user, t.requested);
  const success = JSON.stringify(result) === JSON.stringify(t.expected);
  console.log(`${success ? 'PASS' : 'FAIL'}: ${t.name}`);
  if (!success) {
    console.log(`  Expected: ${JSON.stringify(t.expected)}`);
    console.log(`  Actual:   ${JSON.stringify(result)}`);
    failures++;
  }
});

process.exit(failures > 0 ? 1 : 0);

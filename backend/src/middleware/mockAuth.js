const workspaceId = process.env.MOCK_WORKSPACE_ID ?? "11111111-1111-1111-1111-111111111111";
const adminUserId = process.env.MOCK_ADMIN_USER_ID ?? "22222222-2222-2222-2222-222222222222";
const clientUserId = process.env.MOCK_CLIENT_USER_ID ?? "33333333-3333-3333-3333-333333333333";

export function mockAuth(req, res, next) {
  const requestedRole = String(req.header("x-mock-role") ?? "CLIENT").toUpperCase();
  const role = requestedRole === "ADMIN" ? "ADMIN" : "CLIENT";

  req.user = {
    id: role === "ADMIN" ? adminUserId : clientUserId,
    workspaceId,
    role,
  };

  next();
}
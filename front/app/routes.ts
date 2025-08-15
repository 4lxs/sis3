import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/signin", "routes/signin.tsx"),
  route("/game/:gameId/comments", "routes/gameCommentsPage.tsx")
] satisfies RouteConfig;

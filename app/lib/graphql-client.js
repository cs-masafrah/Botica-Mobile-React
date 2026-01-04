// app/lib/graphql-client.ts
import { GraphQLClient } from "graphql-request";

const GRAPHQL_ENDPOINT =
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000/graphql";

export const graphQLClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    "Content-Type": "application/json",
  },
});

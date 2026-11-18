# Postman

One collection per project. Both frameworks build the same API, so each collection runs against either one: switch the environment, not the collection.

| File | What it is |
|---|---|
| `ecommerce-api.postman_collection.json` | Week 1 requests, grouped by feature, each with tests |
| `ecommerce-express.postman_environment.json` | `baseUrl` = `http://localhost:3001` |
| `ecommerce-nestjs.postman_environment.json` | `baseUrl` = `http://localhost:3101` |
| `ecommerce-express-live.postman_environment.json` | `baseUrl` = `https://express-ecommerce.azazahamed.com` |
| `ecommerce-nestjs-live.postman_environment.json` | `baseUrl` = `https://nest-ecommerce.azazahamed.com` |

## Live environments

The two `-live` environments point at the deployed apps (see [Deployment](../README.md#deployment)). The live databases are already seeded, but their admin doesn't use the seed's `admin-password`, which is public in this repo. The real one is kept out of git:

1. Import the environment, open it, and paste the live admin password into the **Current value** of `adminPassword`. Postman keeps current values on your machine and never exports them.
2. Leave **Initial value** empty, so the password never ends up in an export.

Running the whole collection against a live environment is safe: the **Cleanup** folder deletes what the run created. The run still leaves its customer accounts behind, and one cancelled order per run, because no endpoint deletes them.

## Use it

1. In Postman, **Import** this folder (the collection and the environments).
2. Start the server and run `npm run db:seed` in the project. The seed creates the admin the collection logs in as.
3. Pick an environment (top right), then open **Auth → Register** and send it. That creates a customer and saves its token.

After that, any request works on its own:

- **Tokens:** Register and the Login requests save `customerToken` and `adminToken`. A collection pre-request script logs in again when a token is missing or about to expire.
- **Auth:** set on the collection as `Bearer {{customerToken}}`. Admin requests override it with `{{adminToken}}`, and public requests use No Auth. Each request's **Authorization** tab shows which one it uses.
- **IDs:** requests that create something save its id (`categoryId`, `productId`), and later requests reuse it.
- **Tests:** every request checks its status code and body (**Test Results** tab). A collection-level test checks that every error has the shape `{ "error": { "code" } }`.
- **Filters:** **Products → List products** has every query param on the **Params** tab, unticked. Tick them to try each filter.
- **Raw traffic:** View → Console shows every request and response, including the automatic logins.

## Run all of it

To run every request with its tests, in order: right-click the collection → **Run**. The **Cleanup** folder deletes what the run created, so you can run it again.

From the terminal, with the server running:

```bash
npx newman run postman/ecommerce-api.postman_collection.json -e postman/ecommerce-express.postman_environment.json
```

## Keep it in sync

When an endpoint is added or changed, update the collection in the same pull request: edit it in Postman, then export it here (Collection v2.1). Don't commit environment exports that contain tokens.

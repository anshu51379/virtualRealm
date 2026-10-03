# AI implementation space

The first extension point is `backend/services/ai.js`: `shortlist(query, products)` retrieves real catalogue matches, and `recommend(query, products)` optionally asks a provider to explain them. `frontend/src/components/ShoppingAssistant.jsx` is the user interface. Provider configuration is server-only and request rates are limited.

## Next additions

| Feature                    | Implementation space                                            | Prerequisite                                                          |
| -------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| Semantic catalogue search  | Replace `shortlist` with an embeddings/vector retrieval adapter | Background indexing, explicit model/version, price/category filtering |
| Product description drafts | Add an authenticated seller endpoint                            | Seller approval before saving, factual validation                     |
| Personalized suggestions   | Separate recommendation service                                 | Consent and clear retention controls; exclude payment/shipping data   |
| Support helper             | Retrieval over approved store policies                          | Verified policy corpus and human handoff                              |

## Boundaries

Model-generated text is displayed as plain text. Product cards always come from the database retrieval result. The provider cannot choose arbitrary product IDs, place orders, update prices, or issue refunds. Catalogue strings and the shopper query are treated as untrusted content. Keep model credentials and customer personal data out of frontend bundles and logs.

The current endpoint considers up to 100 public products per request. At larger catalogue sizes, replace that bounded retrieval with indexed search. The included adapter uses a chat-completions HTTP interface; test the chosen provider's response format, request options, cost limits, and privacy settings before enabling it. Add a mock-provider contract test and an evaluation dataset for budget accuracy, unavailable products, conflicting catalogue text, and unsafe requests when extending the provider.

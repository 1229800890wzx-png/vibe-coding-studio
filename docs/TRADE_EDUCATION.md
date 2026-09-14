# Original trade extension for education

Education uses the original cart, quote, order, payment and after-sale services. It does not introduce a second checkout or payment ledger.

## Request/response identity

The original `/app-api/trade/cart/add` and `/reset` accept optional `studentId`; original settlement/create `items[]` accept `studentId` alongside `skuId,count`, or a `cartId`. For cart checkout, the child's identity is read from the persisted, member-owned cart row; a submitted override cannot replace it. Course items require count `1`. Ordinary merchandise continues with `studentId=null`.

The field propagates through `CartDO`, cart list response, `AppTradeOrderSettlementReqVO.Item`, `TradePriceCalculateReqBO.Item`, `TradePriceCalculateRespBO.OrderItem`, `TradeOrderItemDO`, settlement response, original app order-item response and original admin order-item base response. Original MapStruct converters copy the field, with explicit mapping in handcrafted cart/quote builders.

Cart lookup is `(user_id,sku_id,student_id)`. Adding the same course for the same child again selects the existing row with quantity one; another child creates a distinct row. Existing non-course quantity accumulation remains, with the resulting combined quantity checked against stock. Reset retains the persisted child unless an explicit different child is supplied and authorized. Original cart mutations are transactional; education's domain policy participates in that transaction.

Create additionally accepts `expectedPayPrice` in integer fen. Education checkout must send the last displayed settlement `price.payPrice`; the original create service recalculates and compares it before persisting any order. Missing education acknowledgement or a changed total fails with a refresh/confirmation error. Ordinary merchandise may omit this field and preserves its existing behavior. Original item responses include optional learner/current-cohort, enrollment state, refundable remainder and in-flight-refund fields, populated through the education response enrichment SPI.

## Validation SPI

`cn.iocoder.yudao.module.trade.service.education.TradeEducationPolicy` is implemented by the education module:

```java
boolean isEducationSku(Long skuId);
void validatePurchase(Long memberId, Long skuId, Long studentId, Integer count);
```

`TradeEducationValidator` discovers optional implementations through Spring `ObjectProvider`, so the original trade module has no dependency on education. It runs from original cart add/update/reset and shared order price calculation (used by both quote and create). Domain policy checks guardian ownership, cohort availability, learner eligibility and existing enrollment. The trade layer checks child presence, count one, duplicate child/SKU lines, and rejects mixed physical/course checkout. An education field without a matching policy fails closed.

Cart display validates each course row independently. A closed/unavailable/already-enrolled course moves only that row into the original invalid list with an `invalidReason`, leaving other rows usable.

## Inventory and delivery

Price calculation sums all requested quantities by SKU before checking available stock, including distinct children on the same SKU. It never collapses the order lines themselves. Original `TradeOrderConvert.convertNegative`/`convert` aggregate SKU deltas for reservation/restoration, retaining child-specific order rows for enrollment and after-sale handling.

The original discount, coupon, reward and point calculators retain the ordered item list. SKU maps provide product/promotion lookup data, while coupon allocation uses item indices; same-SKU children remain separate through amount allocation. A real calculator test splits a 1,001-fen coupon across two 12,000-fen child lines and checks both identities and the final 22,999-fen total.

Original `DeliveryTypeEnum.EDUCATION=3` represents teaching-service delivery. The original delivery calculator validates that each product supports this type and charges no shipping or address service. Education validation clears quote address/pickup fields. Original order update/lifecycle changes (coordinated with the lifecycle owner) skip address lookup, reject logistics operations, and manage payment/refund rights through original handlers. The create request still requires an explicit delivery type, so only preview quotes may omit it.

Apply `infra/sql/trade-education.sql` once after the original MySQL schema. It adds nullable `student_id` to `trade_cart` and `trade_order_item`, lookup indexes and original `trade_delivery_type=3` dictionary data. It creates no base business tables.

## Tests

Added JUnit tests: `TradeEducationValidatorTest`, `EducationCartServiceTest`, `TradeEducationConversionTest`, `TradeEducationPriceTest`. They cover distinct children, idempotent same-child add, combined cart/quote inventory, original item conversion, stored child ownership source, positive/negative stock aggregation, count validation, absent policy, mixed baskets, ordinary shipping behavior and service delivery without shipping collaborators. The original `TradePriceServiceImplTest` receives a mock of the new validator so its non-course pricing regression remains meaningful.

The four new test classes plus original `TradePriceServiceImplTest` passed: 25 tests, zero failures/errors (`.tools/trade-education-tests.log`). Coverage also includes per-row cart invalidation, same-SKU coupon allocation, missing/changed expected-price rejection and ordinary checkout omission. These unit tests do not by themselves prove concurrent payment/refund lifecycle correctness. The separate actual-MySQL suite `tooling/bootstrap/verify-education-trade.mjs` verifies two-child cart/quote/order identity, stock reservation, concurrent last-seat purchase, duplicate-child rejection, unpaid cancellation, repeated partial KEEP refunds, refund caps, transfer and CANCEL restoration to the current cohort.

## Coupon acceptance and client selection

Checkout displays the original settlement response's eligible coupons through the original `s-coupon-select` component. One selected coupon ID and the recalculated `expectedPayPrice` are sent to the original order-create endpoint. The server remains authoritative for eligibility and every child's allocated amount.

`tooling/bootstrap/verify-education-coupons.mjs` passed six real local API checks. Original template creation and administrator issuance produced one scoped flat coupon. Two child lines at 5,000 fen each shared a 1,001-fen discount as 500 and 501 fen, leaving an 8,999-fen payable order with both student identities retained. Unpaid cancellation restored both seats and the original coupon. After payment through the original local mock channel, a 100-fen partial KEEP refund retained the redeemed coupon and both active enrollments; no new coupon-return policy was added.

The test exposed omitted original template counter fields. The public initialization adapter now declares `promotion_coupon_template.take_count` and `use_count` as `INT NOT NULL DEFAULT 0`, consistent with the original mapper's increment operations. `21-public-model-reconciliations.sql` fills only existing NULL values from original non-deleted coupon rows and USED status counts in the same tenant. It does not reset existing counters. The test report records a separate unused TEST coupon and two unbought child cart lines for browser inspection, plus previously selected cart IDs for reversible selection restoration. No coupon is sent through an external messaging channel.

## Late payment and original compensation

The education lifecycle handler treats a payment received after cancellation as a recovery decision under child/cohort locks. It revalidates current registration and intra-order schedule compatibility, attempts to reacquire the current original SKU capacity once, then restores pending/active teaching state only if fulfillment remains possible. Paid trial bookings reference the original order item; ORDER-source enrollment keeps `trial_booking_id` NULL because that pointer is reserved for FREE_TRIAL-source enrollment.

If fulfillment fails, the order remains unfulfilled and a durable compensation state requests an original pay refund. Confirmation comes from original pay/refund records and callback tasks. Maintenance retries unresolved intent through the original Quartz infrastructure. The client never manufactures paid status, enrollment success or refund confirmation.

`tooling/bootstrap/verify-education-late-payment.mjs` passed seven actual local checks using original order cancellation followed by the original mock pay API, without synthetic SQL changes or test-only endpoints. Fulfillable order 21/pay order 21 reacquired one seat, activated one enrollment and created one paid-trial record. Capacity-exhausted order 22/pay order 22 followed persisted `RELEASED → REFUND_PENDING → REFUNDED` state and original refund 11 for 1,200 fen, with no active enrollment. Repeated original payment/refund notifications did not duplicate stock, enrollment, trial booking or guardian notification. A separate competitor order was canceled through the original API to restore its test seat. Fixture IDs and observed callback states are in `.runtime/education-late-payment-report.json`.

These are isolated local channel checks. Real merchant credentials, authenticated provider callbacks and real-channel refund acceptance remain deployment work.

# Cadence: launch networks, formats and publishing gates

Research/update date: **5 October 2026**, Europe/London.
**Confirmed launch:** LinkedIn, Facebook, Instagram, TikTok and X/Twitter. YouTube is future scope.
Requested authoring formats: text-only, images, carousels, landscape videos and vertical videos.
The user and his wife have separate logins; multiple destinations per network are required, subject to the plan allowance.
**The user has accepted manual handoffs where automatic routes require paid API access or approval.** All five networks remain available in the first usable release through permitted direct/manual routes.
The budget still excludes paid social APIs and management services beyond database/hosting. Tier design does not itself authorise spending.
AI remains deferred until project revenue; future Creator-and-above AI does not override provider permissions or format restrictions.
Documentation research only: no accounts, credentials, app registrations, payments or real publications were changed or tested.

## 1. Honest launch availability

All five networks must appear in account selection, drafting, format-aware previews, review, calendar and delivery history.
For each destination/format, distinguish **automatic**, **manual**, **permission required**, **budget blocked**, **unsupported** and **unverified** capabilities.
A manually configured destination does not claim OAuth-verified ownership. Automatic posting needs a permitted official route and verified grants.
Manual delivery supplies approved copy, ordered assets, descriptions and destination instructions for the user to publish in the network's app/site.
Copying text, downloading media or opening an app does not prove publication. Retain explicit confirmation, URL/time and confirming user.
No password sharing, scraping, browser automation or private endpoints may bypass an unavailable adapter.
Implementation may prove adapters sequentially; the first usable release still provides the agreed five-network coverage.

## 2. Format matrix

**D** = official direct-route candidate, subject to grants and implementation tests. **M** = manual/native delivery under current pilot/budget constraints. **U** = unavailable/unverified native format or direct contract; offer only an explicitly approved alternative.
An orientation is a video property, not a promise that every placement accepts it. Validate ratio, dimensions, duration, codec, size and account entitlement separately.

| Destination | Text-only | Single image | Carousel / ordered slides | Landscape video | Vertical video | Launch delivery |
|---|---|---|---|---|---|---|
| LinkedIn member/organisation | D | D | D organic multi-image or document; Carousel API is sponsored-only | D video within selected contract | D video within selected contract | Direct after product/scope/role gate; M otherwise |
| Facebook Page | D candidate; current feed contract needs verification | D candidate; current photo contract needs verification | Multi-photo candidate; not a promised organic ad carousel | D candidate; selected video/Reels route must pass | D candidate; Page Reels workflow documented | Current grants and each format must pass; M until then |
| Facebook personal/professional profile | M; direct Cadence contract unverified | M | M multi-photo where native app offers it | M; native placement validation | M; native placement validation | Native; profile sign-in does not grant Page posting |
| Instagram Professional Business/Creator | U for text-only feed publication; optional text card is an image adaptation | D candidate | D carousel candidate; current child/count/ratio contract must pass | D candidate for accepted video placement/ratio | D candidate for selected Reels/video route | Selected login flow and publishing grant must pass; M otherwise |
| TikTok | M native text; no documented text-only posting endpoint found | M native photo | M native Photo Mode/slideshow | M native video; internal Direct Post restriction applies | M native video; same restriction | Manual pilot; public-client eligibility/audit is a separate gate |
| X/Twitter | M; D incurs charges | M; D incurs charges | M multi-image; D supports up to four photos, not generic carousel | M; D video depends on entitlement/media category | M; same validation | Manual under no-paid-API rule |
| YouTube — future | U: Community text-post adapter unverified | U: Community image-post adapter unverified | U: Community carousel adapter unverified | Future video candidate | Future video/Shorts candidate; verify placement | Excluded from launch; affected unverified projects upload privately until audit |

Meta candidates are not certified direct support: current developer pages returned HTTP 429 or unusable bodies in this research.
Do not substitute third-party copies of Meta documentation for a verified current endpoint contract.
An Instagram text-card export, LinkedIn PDF deck, Facebook multi-photo post and X multi-image post must retain their actual format name and preview.
Never silently convert a carousel to video or crop landscape to vertical. The user approves the destination-specific derivative.
“All formats” here covers the five requested authoring formats. Stories, live streams, licensed music, shopping/ads, polls and every native app feature need separate scope/permission decisions.

## 3. LinkedIn: genuine organic formats and separate grants

The official Posts API supports organic text, images, videos, documents and multi-image posts; its Carousel API is sponsored-only.
Reuse slide authoring, then select a document or multi-image variant for organic publication.
Member posting uses `w_member_social`; organisation posting requires `w_organization_social` and an accepted organisation role.
Read/analytics access is separate; a write grant does not imply arbitrary member-post/metric access.
Use a supported API version at implementation: the documentation warns that `202510` sunsets on 15 October 2026.
[Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-09), [access products](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access), [access levels](https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access?view=li-lms-2026-09).

The MultiImage reference provides per-image `altText`; review each slide description.
[MultiImage API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/multiimage-post-api?view=li-lms-2026-09).

Native Help and the Videos API show different duration/file-size limits. Validate the chosen API contract rather than copying native-app limits into it.
The Videos API documents captions-file and thumbnail uploads as separate tasks; these do not replace visual accessibility descriptions.
[Videos API](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/videos-api), [native video troubleshooting](https://www.linkedin.com/help/linkedin/answer/a548372).

## 4. Meta: account types and incomplete current evidence

Meta documents managed Page inventory via `/me/accounts` with Page name/ID/token/tasks.
Its Page Reels collection shows initiation, upload, status and publication, but includes February 2023 examples and Graph v15/v16 identifiers.
This establishes a workflow, not current video limits or Cadence's granted access.
[Meta-owned Facebook collection](https://www.postman.com/meta/facebook/documentation/r56bjfd/facebook-api?entity=request-23987686-a9ea20fe-d410-4804-8bbe-5cc5985e9443).

Meta's indexed Instagram collection describes Business/Creator accounts and excludes consumer accounts from the Facebook Login setup, which requires a linked Page.
Instagram Login is a separate configuration without that linked-Page requirement.
Keep scope chains separate: Facebook Login uses `instagram_basic`/`instagram_content_publish` with Page permissions; Instagram Login uses `instagram_business_basic`/`instagram_business_content_publish`.
Request only actual features; messaging/comment scopes listed for a whole collection do not establish publishing dependencies.
[Facebook Login collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-894be833-d0b6-4877-859e-c61ae6474d64), [Instagram Login collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-66f145c2-29b1-4d97-afbd-5710369027c0).

Current publishing/permission pages were not retrievable. Indexed collection evidence does not certify current carousel limits, alt-text fields, external-user review or business-verification requirements.
Before enabling a direct format, verify the current reference/dashboard, required access tier, actual roles/grants, asset-fetch behaviour, final public visibility and safe reconciliation.
Candidate Page permissions include `pages_show_list`, `pages_read_engagement` and `pages_manage_posts`; these are checks, not obtained grants.
External customers require their own review gate; a Live switch alone does not grant all scopes.
[Pages getting started](https://developers.facebook.com/docs/pages-api/getting-started/), [Page posts](https://developers.facebook.com/docs/pages-api/posts/), [Page photos](https://developers.facebook.com/docs/graph-api/reference/page/photos/), [Instagram publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [access levels](https://developers.facebook.com/docs/graph-api/overview/access-levels/), [App Review](https://developers.facebook.com/docs/app-review/).

## 5. TikTok: formats exist, internal Direct Post is restricted

Direct Post guidelines exclude private/internal clients and tools limited to accounts managed by oneself/team.
The FSS-only pilot therefore uses the accepted manual route. Unaudited Direct Post is private-only; a successful private upload does not prove public eligibility.
A future public client must pass eligibility/audit and implement creator information, editable preview, user-selected privacy/interactions, commercial disclosure and consent.
[Direct Post guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines).

The photo endpoint supports multiple photo URLs. `MEDIA_UPLOAD` requires users to continue through a TikTok inbox notification and complete publication.
Its `video.upload` grant/review is a separate gate, not assumed approved for this pilot or equivalent to automatic posting.
The video/transfer references establish video routes. Validate against the creator's actual permitted duration, not a universal account limit.
[Photo posting](https://developers.tiktok.com/doc/content-posting-api-reference-photo-post), [video Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post), [media-transfer restrictions](https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide).

TikTok introduced native text posts, but the retrieved Content Posting contracts expose photo/video routes rather than a verified text-only endpoint.
Keep manual text handoff; a photo/video caption is not a native text post.
[Official text-post announcement](https://newsroom.tiktok.com/text-posts?lang=en).

## 6. X/Twitter: technical route with API costs

X currently uses prepaid pay-per-use: ordinary Post Create is US$0.015, Create with URL US$0.200, media metadata US$0.005/request and Trends US$0.010/request.
Reads/analytics add costs. Live Console pricing is authoritative and can change.
Temporary credits are not a sustainable free allowance; saving a card or enabling paid recharge is not authorised.
Use the accepted manual route until an explicit API budget or separately verified customer-funded credentials model is agreed.
[Price list](https://docs.x.com/x-api/getting-started/pricing), [temporary credit terms](https://docs.x.com/x-api/getting-started/free-credits).

Create Posts supports up to four photos, one GIF or one video; upload first and attach returned media IDs.
Video allowance follows the posting user's Premium/verified status and upload media category. A Cadence Professional plan cannot grant X Premium allowances.
Quote posting is Enterprise-only in the current reference and excluded from the baseline adapter.
[Create Posts](https://docs.x.com/x-api/posts/create-post), [chunked upload](https://docs.x.com/x-api/media/quickstart/media-upload-chunked).

Native X supports image descriptions. The retrieved v2 metadata page does not expose `alt_text` in its rendered schema; the older official article uses v1.1.
Certify API description transmission only after current OpenAPI/documentation and an authorised test; a generic metadata endpoint does not prove it.
Manual handoff supplies descriptions for the user to enter.
[Native descriptions](https://help.x.com/en/using-x/add-image-descriptions), [current metadata reference](https://docs.x.com/x-api/media/create-media-metadata), [historical API article](https://blog.x.com/developer/en_us/a/2016/alt-text-support-for-twitter-cards-and-the-rest-api).

## 7. Accessibility, profiles and paid-plan boundaries

Store reviewed descriptions per image/slide independently of network. Future AI descriptions remain proposals until approved against the actual image.
Record whether the destination transmits them: local descriptions alone do not make the remote post accessible.
Video speech subtitles, on-screen text, visual/audio description and thumbnails are distinct capabilities.
Meta/TikTok alt-text API transmission remains unverified here; report gaps and provide native instructions where available.
Bio and SEO/display-name optimisation produces suggestions and copy/export. Publishing permission does not grant profile-edit permission; no cross-network identity-edit route is certified here.
Name/handle changes need a separate user-controlled action if a future official route is proved.

Plan entitlement limits networks, active destinations and collaborators. It cannot grant provider roles, remove external quotas or permit blocked formats.
Maintain stable network IDs, workspace-scoped destinations, independent token/capability state and per-account throttling.
Collaborators sharing a destination are users, not extra social accounts; never share network passwords.
Professional “unlimited accounts” means no Cadence plan cap; provider quotas, storage, security and transparent fair-use rules still apply.

## 8. Implementation acceptance gates

1. Provide five-network destination/format selection and labelled manual paths in the first usable release; YouTube is absent from launch onboarding.
2. Inventory actual account types/IDs/owners; isolate tokens, roles, capabilities and rate limits per destination.
3. Validate media, preserve slide order and label text-card/PDF/multi-photo adaptations; approve every destination derivative.
4. Prove direct routes incrementally against actual grants, formats and public visibility while retaining all five manual/direct network choices.
5. Test sleeping phones, interrupted uploads, revoked tokens, simultaneous collaborators, processing delay, duplicate wake-ups and lost create responses.
6. Persist provider/container/post IDs and attempt history; `outcome_unknown` requires reconciliation before another create request.
7. Distinguish cancellation before send and during processing. Opening/downloading never becomes published.
8. Gate future Creator AI analytics/trends on permitted data and funding; missing metrics are not zero or evidence of a trend.
9. Repeat external-user review, tenant isolation, retention/deletion, limits and support checks before advertising direct coverage.

Future YouTube evidence: [official upload/audit restriction](https://developers.google.com/youtube/v3/docs/videos/insert).
Read-only research and Markdown review only; no application/provider tests were run.

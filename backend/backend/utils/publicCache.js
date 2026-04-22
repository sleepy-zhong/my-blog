const crypto = require('crypto');

const PUBLIC_HOME_CAT_CACHE_KEY = 'public:home-cats:v1';
const PUBLIC_HOME_CAT_CACHE_PATTERNS = [
  PUBLIC_HOME_CAT_CACHE_KEY,
];

const PUBLIC_ARTICLE_CACHE_PATTERNS = [
  'public:articles:list:v1:*',
  'public:articles:count:v1:*',
  'public:articles:published:v1:*',
  'public:articles:detail:id:v1:*',
  'public:articles:detail:slug:v1:*',
];
const PUBLIC_ARTICLE_DETAIL_CACHE_PATTERNS = [
  'public:articles:detail:id:v1:*',
  'public:articles:detail:slug:v1:*',
];
const PUBLIC_ARTICLE_DETAIL_CACHE_TTL_SECONDS = 300;

const PUBLIC_CATEGORY_CACHE_KEY = 'public:categories:list:v1';
const PUBLIC_CATEGORY_TREE_CACHE_KEY = 'public:categories:tree:v1';
const PUBLIC_CATEGORY_CACHE_PATTERNS = [
  PUBLIC_CATEGORY_CACHE_KEY,
  PUBLIC_CATEGORY_TREE_CACHE_KEY,
  'public:categories:summary:v1:*',
];
const PUBLIC_CATEGORY_DERIVED_CACHE_PATTERNS = [
  'public:categories:summary:v1:*',
];

const PUBLIC_TAG_CACHE_KEY = 'public:tags:list:v1';
const PUBLIC_TAG_CACHE_PATTERNS = [
  PUBLIC_TAG_CACHE_KEY,
  'public:tags:popular:v1:*',
];
const PUBLIC_TAG_DERIVED_CACHE_PATTERNS = [
  'public:tags:popular:v1:*',
];

const PUBLIC_TAXONOMY_CACHE_PATTERNS = [
  ...PUBLIC_CATEGORY_CACHE_PATTERNS,
  ...PUBLIC_TAG_CACHE_PATTERNS,
];
const PUBLIC_DISCOVERY_CACHE_PATTERNS = [
  ...PUBLIC_CATEGORY_DERIVED_CACHE_PATTERNS,
  ...PUBLIC_TAG_DERIVED_CACHE_PATTERNS,
];
const PUBLIC_ARTICLE_INVALIDATION_PATTERNS = [
  ...PUBLIC_ARTICLE_CACHE_PATTERNS,
  ...PUBLIC_DISCOVERY_CACHE_PATTERNS,
];

const PUBLIC_SETTINGS_CACHE_KEY = 'public:settings:v1';
const PUBLIC_SETTINGS_CACHE_PATTERNS = [
  PUBLIC_SETTINGS_CACHE_KEY,
];

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeCsvNumbers(...values) {
  const items = values
    .flatMap((value) => normalizeText(value).split(','))
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isInteger(item));

  return Array.from(new Set(items)).sort((left, right) => left - right);
}

function normalizeCsvStrings(value, { sort = true } = {}) {
  const items = normalizeText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!sort) {
    return items;
  }

  return Array.from(new Set(items)).sort();
}

function buildHashedKey(prefix, payload) {
  const serialized = JSON.stringify(payload);
  const hash = crypto.createHash('sha1').update(serialized).digest('hex');
  return `${prefix}:${hash}`;
}

function hasOwnQueryValue(req, key) {
  return Object.prototype.hasOwnProperty.call(req?.query || {}, key);
}

function getEffectiveArticleStatus(req) {
  const rawStatus = normalizeText(req?.query?.status).toLowerCase();

  if (!hasOwnQueryValue(req, 'status')) {
    return 'published';
  }

  return rawStatus;
}

function shouldBypassPublicArticleCache(req) {
  return getEffectiveArticleStatus(req) !== 'published';
}

function buildPublicArticleListCacheKey(req) {
  return buildHashedKey('public:articles:list:v1', {
    page: normalizeInteger(req?.query?.page, 1),
    pageSize: normalizeInteger(req?.query?.pageSize, 10),
    keyword: normalizeText(req?.query?.keyword),
    status: getEffectiveArticleStatus(req),
    categoryIds: normalizeCsvNumbers(req?.query?.categories, req?.query?.category),
    tagIds: normalizeCsvNumbers(req?.query?.tags, req?.query?.tag),
    categoryMode: normalizeText(req?.query?.categoryMode).toLowerCase() || 'any',
    tagMode: normalizeText(req?.query?.tagMode).toLowerCase() || 'any',
    fields: normalizeCsvStrings(req?.query?.fields),
    include: normalizeCsvStrings(hasOwnQueryValue(req, 'include') ? req?.query?.include : 'categories,tags,user'),
    sort: normalizeText(req?.query?.sort),
  });
}

function buildPublicArticleCountCacheKey(req) {
  return buildHashedKey('public:articles:count:v1', {
    keyword: normalizeText(req?.query?.keyword),
    status: getEffectiveArticleStatus(req),
    categoryIds: normalizeCsvNumbers(req?.query?.categories, req?.query?.category),
    tagIds: normalizeCsvNumbers(req?.query?.tags, req?.query?.tag),
    categoryMode: normalizeText(req?.query?.categoryMode).toLowerCase() || 'any',
    tagMode: normalizeText(req?.query?.tagMode).toLowerCase() || 'any',
  });
}

function buildPublicPublishedArticlesCacheKey(req) {
  return buildHashedKey('public:articles:published:v1', {
    page: normalizeInteger(req?.query?.page, 1),
    pageSize: normalizeInteger(req?.query?.pageSize, 10),
    keyword: normalizeText(req?.query?.keyword),
    categoryIds: normalizeCsvNumbers(req?.query?.category),
    tagIds: normalizeCsvNumbers(req?.query?.tag),
  });
}

function buildPublicCategorySummaryCacheKey(req) {
  return buildHashedKey('public:categories:summary:v1', {
    status: getEffectiveArticleStatus(req),
    keyword: normalizeText(req?.query?.keyword),
    tagIds: normalizeCsvNumbers(req?.query?.tags),
    tagMode: normalizeText(req?.query?.tagMode).toLowerCase() || 'any',
  });
}

function buildPublicTagPopularCacheKey(req) {
  return buildHashedKey('public:tags:popular:v1', {
    limit: normalizeInteger(req?.query?.limit, 30),
    status: getEffectiveArticleStatus(req),
    keyword: normalizeText(req?.query?.keyword),
    categoryIds: normalizeCsvNumbers(req?.query?.categories),
    categoryMode: normalizeText(req?.query?.categoryMode).toLowerCase() || 'any',
  });
}

function buildPublicArticleDetailCacheKey(type, identifier, query = {}) {
  return buildHashedKey(`public:articles:detail:${type}:v1`, {
    identifier: normalizeText(identifier),
    fields: normalizeCsvStrings(query?.fields),
    include: normalizeCsvStrings(
      Object.prototype.hasOwnProperty.call(query || {}, 'include')
        ? query?.include
        : 'categories,tags,user'
    ),
  });
}

module.exports = {
  PUBLIC_ARTICLE_CACHE_PATTERNS,
  PUBLIC_ARTICLE_DETAIL_CACHE_PATTERNS,
  PUBLIC_ARTICLE_DETAIL_CACHE_TTL_SECONDS,
  PUBLIC_ARTICLE_INVALIDATION_PATTERNS,
  PUBLIC_CATEGORY_CACHE_KEY,
  PUBLIC_CATEGORY_CACHE_PATTERNS,
  PUBLIC_CATEGORY_DERIVED_CACHE_PATTERNS,
  PUBLIC_CATEGORY_TREE_CACHE_KEY,
  PUBLIC_DISCOVERY_CACHE_PATTERNS,
  PUBLIC_HOME_CAT_CACHE_KEY,
  PUBLIC_HOME_CAT_CACHE_PATTERNS,
  PUBLIC_SETTINGS_CACHE_KEY,
  PUBLIC_SETTINGS_CACHE_PATTERNS,
  PUBLIC_TAG_CACHE_KEY,
  PUBLIC_TAG_CACHE_PATTERNS,
  PUBLIC_TAG_DERIVED_CACHE_PATTERNS,
  PUBLIC_TAXONOMY_CACHE_PATTERNS,
  buildPublicArticleCountCacheKey,
  buildPublicArticleDetailCacheKey,
  buildPublicArticleListCacheKey,
  buildPublicCategorySummaryCacheKey,
  buildPublicPublishedArticlesCacheKey,
  buildPublicTagPopularCacheKey,
  shouldBypassPublicArticleCache,
};

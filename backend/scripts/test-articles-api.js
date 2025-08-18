/*
  TechBlog API smoke tests for updated article list/count params.
  Usage:
    node scripts/test-articles-api.js --baseUrl=http://localhost:3000 --token=YOUR_JWT
*/

/* eslint-disable no-console */
const assert = require('assert');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {};
  for (const arg of args) {
    const [key, value] = arg.split('=');
    if (key && value) {
      options[key.replace(/^--/, '')] = value;
    }
  }
  return options;
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const http = async (url, { method = 'GET', headers = {}, body } = {}) => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  return { status: res.status, ok: res.ok, data };
};

const pretty = (obj) => JSON.stringify(obj, null, 2);

const run = async () => {
  const { baseUrl = 'http://localhost:3000', token = '' } = parseArgs();
  const apiBase = baseUrl.replace(/\/$/, '') + '/api';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const results = [];
  const record = (name, ok, extra = {}) => {
    results.push({ name, ok, ...extra });
    const mark = ok ? '✅' : '❌';
    console.log(`${mark} ${name}`);
    if (!ok && extra.details) {
      console.log(extra.details);
    }
  };

  try {
    // 1) 基础列表
    {
      const qs = new URLSearchParams({ page: '1', pageSize: '5', status: 'published' }).toString();
      const { status, data } = await http(`${apiBase}/articles?${qs}`);
      const ok = status === 200 && data && data.code === 0 && data.data && Array.isArray(data.data.list);
      record('GET /articles 基础列表', ok, { details: ok ? undefined : pretty(data) });
    }

    // 2) 字段投影 fields
    {
      const qs = new URLSearchParams({ page: '1', pageSize: '3', fields: 'PostID,Title,PublishedAt' }).toString();
      const { status, data } = await http(`${apiBase}/articles?${qs}`);
      const ok = status === 200 && data && data.code === 0 && data.data && Array.isArray(data.data.list);
      const first = ok && data.data.list[0];
      const shapeOk = !first || (first.PostID !== undefined && first.Title !== undefined && 'Content' in first === false);
      record('GET /articles fields 投影', ok && shapeOk, { details: ok && !shapeOk ? pretty(data.data.list[0]) : pretty(data) });
    }

    // 3) 关联 include 展开（categories,tags,user）
    {
      const qs = new URLSearchParams({ page: '1', pageSize: '3', include: 'categories,tags,user' }).toString();
      const { status, data } = await http(`${apiBase}/articles?${qs}`);
      const ok = status === 200 && data && data.code === 0 && data.data && Array.isArray(data.data.list);
      const first = ok && data.data.list[0];
      const shapeOk = !first || (first.Categories !== undefined && first.Tags !== undefined && first.User !== undefined);
      record('GET /articles include 展开', ok && shapeOk, { details: ok && !shapeOk ? pretty(data.data.list[0]) : pretty(data) });
    }

    // 4) 多分类/标签 + any/all 模式
    {
      const qs = new URLSearchParams({ page: '1', pageSize: '3', categories: '1,2', tags: '1,2', categoryMode: 'any', tagMode: 'any' }).toString();
      const { status, data } = await http(`${apiBase}/articles?${qs}`);
      const ok = status === 200 && data && data.code === 0 && data.data && typeof data.data.total === 'number';
      record('GET /articles 多分类/标签 any 模式', ok, { details: ok ? undefined : pretty(data) });
    }

    // 5) 排序 sort
    {
      const qs = new URLSearchParams({ page: '1', pageSize: '5', sort: 'PublishedAt:desc,CreatedAt:desc' }).toString();
      const { status, data } = await http(`${apiBase}/articles?${qs}`);
      const ok = status === 200 && data && data.code === 0 && data.data && Array.isArray(data.data.list);
      record('GET /articles 排序 sort', ok, { details: ok ? undefined : pretty(data) });
    }

    // 6) 总数接口 /articles/count（与列表同过滤）
    {
      const qs = new URLSearchParams({ keyword: '', status: 'published', categories: '1,2', tags: '1,2', categoryMode: 'any', tagMode: 'any' }).toString();
      const { status, data } = await http(`${apiBase}/articles/count?${qs}`);
      const ok = status === 200 && data && data.code === 0 && data.data && typeof data.data.total === 'number';
      record('GET /articles/count 统计', ok, { details: ok ? undefined : pretty(data) });
    }

    // 7) 错误：非法 fields
    {
      const qs = new URLSearchParams({ fields: 'Foo,Bar' }).toString();
      const { status, data } = await http(`${apiBase}/articles?${qs}`);
      const ok = status === 400 && data && data.message;
      record('GET /articles 非法 fields=Foo,Bar -> 400', ok, { details: ok ? undefined : pretty(data) });
    }

    // 8) 错误：非法 include
    {
      const qs = new URLSearchParams({ include: 'likes,comments' }).toString();
      const { status, data } = await http(`${apiBase}/articles?${qs}`);
      const ok = status === 400 && data && data.message;
      record('GET /articles 非法 include=likes,comments -> 400', ok, { details: ok ? undefined : pretty(data) });
    }

    // 9) 鉴权路径冒烟（需要 token，若未提供则跳过）
    if (token) {
      // 创建-删除一篇草稿文章，保持数据库整洁
      const createRes = await http(`${apiBase}/articles`, {
        method: 'POST',
        headers: authHeaders,
        body: {
          title: 'API Test Draft',
          content: 'temporary content',
          status: 'draft',
        },
      });
      const createdOk = createRes.status === 201 || (createRes.status === 200 && createRes.data && createRes.data.code === 0);
      let postId;
      if (createdOk) {
        postId = (createRes.data.data && createRes.data.data.PostID) || (createRes.data.PostID);
      }
      record('POST /articles 创建草稿(需token)', createdOk, { details: createdOk ? undefined : pretty(createRes.data) });

      if (postId) {
        // 更新状态
        const upd = await http(`${apiBase}/articles/${postId}/status`, {
          method: 'PUT',
          headers: authHeaders,
          body: { status: 'draft' },
        });
        const updOk = upd.status === 200;
        record('PUT /articles/{id}/status 修改状态(需token)', updOk, { details: updOk ? undefined : pretty(upd.data) });

        // 删除
        const del = await http(`${apiBase}/articles/${postId}`, { method: 'DELETE', headers: authHeaders });
        const delOk = del.status === 200;
        record('DELETE /articles/{id} 删除(需token)', delOk, { details: delOk ? undefined : pretty(del.data) });
      }
    } else {
      console.log('ℹ️ 未提供 --token，已跳过鉴权相关冒烟用例');
    }

    // 汇总
    await sleep(50);
    const passed = results.filter((r) => r.ok).length;
    const failed = results.length - passed;
    console.log('\n===== Test Summary =====');
    results.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'} - ${r.name}`));
    console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${failed}`);

    // 非零退出码以便在 CI 中失败
    assert.strictEqual(failed, 0, `有 ${failed} 个用例失败`);
  } catch (err) {
    console.error('\n测试执行异常:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
};

run();



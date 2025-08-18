import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import PostList from '../views/PostList.vue'
import PostDetail from '../views/PostDetail.vue'
import AdminHome from '../views/Admin/AdminHome.vue'
import AdminLayout from '../views/Admin/AdminLayout.vue'
import UserManage from '../views/Admin/UserManage.vue'
import RoleManage from '../views/Admin/RoleManage.vue'
import ArticleManage from '../views/Admin/ArticleManage.vue'
import CommentManage from '../views/Admin/CommentManage.vue'
import CategoryManage from '../views/Admin/CategoryManage.vue'
import TagManage from '../views/Admin/TagManage.vue'
import AttachmentManage from '../views/Admin/AttachmentManage.vue'
import LogManage from '../views/Admin/LogManage.vue'
import Settings from '../views/Admin/Settings.vue'
// import ArticleImport from '../views/ArticleImport.vue'
import ArticlePublish from '../views/ArticlePublish.vue'
import { useUserStore, useMessageStore } from '../store/user'
import Forbidden from '../views/Forbidden.vue'

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'Home', component: Home, meta: { title: '首页' } },
  { path: '/login', name: 'Login', component: Login, meta: { title: '登录' } },
  { path: '/register', redirect: '/login?mode=register' },
  { path: '/403', name: 'Forbidden', component: Forbidden },
  { path: '/posts', name: 'PostList', component: PostList, meta: { title: '文章列表' } },
  { path: '/posts/:id', name: 'PostDetail', component: PostDetail, props: true, meta: { title: '文章详情' } },
  // { path: '/ArticleImport', name: 'ArticleImport', component: ArticleImport, meta: { title: '文章导入', requiresAuth: true, roles: ['admin', 'superadmin', 'editor', 'author'] } },
  { path: '/publish', name: 'ArticlePublish', component: ArticlePublish, meta: { title: '发布文章', requiresAuth: true, roles: ['admin', 'superadmin', 'editor', 'author'] } },
  { path: '/ArticlePublish', name: 'ArticlePublishOld', component: ArticlePublish, meta: { title: '发布文章（旧）', requiresAuth: true, roles: ['admin', 'superadmin', 'editor', 'author'] } },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { title: '管理后台', requiresAuth: true, roles: ['admin', 'superadmin', 'editor'] },
    children: [
      { path: '', name: 'AdminHome', component: AdminHome, meta: { title: '仪表盘' } },
      { path: 'users', name: 'UserManage', component: UserManage, meta: { title: '用户管理' } },
      { path: 'roles', name: 'RoleManage', component: RoleManage, meta: { title: '角色管理' } },
      { path: 'articles', name: 'ArticleManage', component: ArticleManage, meta: { title: '文章管理' } },
      { path: 'comments', name: 'CommentManage', component: CommentManage, meta: { title: '评论管理' } },
      { path: 'categories', name: 'CategoryManage', component: CategoryManage, meta: { title: '分类管理' } },
      { path: 'tags', name: 'TagManage', component: TagManage, meta: { title: '标签管理' } },
      { path: 'attachments', name: 'AttachmentManage', component: AttachmentManage, meta: { title: '附件管理' } },
      { path: 'logs', name: 'LogManage', component: LogManage, meta: { title: '日志管理' } },
      { path: 'settings', name: 'Settings', component: Settings, meta: { title: '系统设置' } },
    ]
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫：登录鉴权和后台权限校验（仅保护标记了 requiresAuth 的路由）
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const messageStore = useMessageStore()

  // 已登录访问登录页，直接回到首页
  if (to.path === '/login' && userStore.token) {
    return next('/')
  }

  const requiresAuth = to.matched.some(r => r.meta && (r.meta as any).requiresAuth)
  if (!requiresAuth) {
    return next()
  }

  // 需要登录
  if (!userStore.token) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // 拉取用户信息（若未加载）
  if (!userStore.user) {
    try {
      await userStore.fetchUser()
    } catch (e) {
      // 拉取失败，视为未登录
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }

  // 角色校验（如有）
  const requiredRoles: string[] | undefined = (to.meta as any).roles || to.matched.map(r => (r.meta as any).roles).find(Boolean)
  if (requiredRoles && requiredRoles.length) {
    let roles: string[] = Array.isArray(userStore.user?.Roles) ? (userStore.user!.Roles as any) : []
    if (roles.length && typeof roles[0] === 'object' && roles[0] !== null && 'Name' in roles[0]) {
      roles = (roles as any[]).map(r => (r as any).Name)
    }
    const hasRole = roles.some(r => requiredRoles.includes(r))
    if (!hasRole) {
      messageStore.show('无权限访问', 'error')
      return next({ path: '/403', query: { from: to.fullPath } })
    }
  }

  next()
})

export default router 
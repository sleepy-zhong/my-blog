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
import HomeCatManage from '../views/Admin/HomeCatManage.vue'
import LogManage from '../views/Admin/LogManage.vue'
import Settings from '../views/Admin/Settings.vue'
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
  { path: '/publish', name: 'ArticlePublish', component: ArticlePublish, meta: { title: '发布文章', requiresAuth: true, roles: ['admin', 'editor', 'author'] } },
  { path: '/ArticlePublish', name: 'ArticlePublishOld', component: ArticlePublish, meta: { title: '发布文章（旧）', requiresAuth: true, roles: ['admin', 'editor', 'author'] } },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { title: '管理后台', requiresAuth: true, roles: ['admin', 'editor'] },
    children: [
      { path: '', name: 'AdminHome', component: AdminHome, meta: { title: '仪表盘' } },
      { path: 'users', name: 'UserManage', component: UserManage, meta: { title: '用户管理' } },
      { path: 'roles', name: 'RoleManage', component: RoleManage, meta: { title: '角色管理' } },
      { path: 'articles', name: 'ArticleManage', component: ArticleManage, meta: { title: '文章管理' } },
      { path: 'comments', name: 'CommentManage', component: CommentManage, meta: { title: '评论管理' } },
      { path: 'categories', name: 'CategoryManage', component: CategoryManage, meta: { title: '分类管理' } },
      { path: 'tags', name: 'TagManage', component: TagManage, meta: { title: '标签管理' } },
      { path: 'attachments', name: 'AttachmentManage', component: AttachmentManage, meta: { title: '附件管理' } },
      { path: 'home-cats', name: 'HomeCatManage', component: HomeCatManage, meta: { title: '首页猫猫管理' } },
      { path: 'logs', name: 'LogManage', component: LogManage, meta: { title: '日志管理' } },
      { path: 'settings', name: 'Settings', component: Settings, meta: { title: '系统设置' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: 96,
        behavior: 'smooth'
      }
    }

    return { top: 0, left: 0 }
  }
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const messageStore = useMessageStore()

  if (!userStore.sessionReady) {
    try {
      await userStore.initSession()
    } catch (_error) {
      // 忽略首次会话探测失败，后续按未登录处理。
    }
  }

  if (to.path === '/login' && userStore.isLogin) {
    return next('/')
  }

  const requiresAuth = to.matched.some(record => Boolean((record.meta as any)?.requiresAuth))
  if (!requiresAuth) {
    return next()
  }

  if (!userStore.isLogin) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  const requiredRoles = (
    (to.meta as any).roles ||
    [...to.matched].reverse().map(record => (record.meta as any)?.roles).find(Boolean)
  ) as string[] | undefined

  if (requiredRoles?.length) {
    const roles = Array.isArray(userStore.user?.Roles) ? userStore.user!.Roles : []
    const hasRole = roles.some(role => requiredRoles.includes(role))

    if (!hasRole) {
      messageStore.show('无权限访问', 'error')
      return next({ path: '/403', query: { from: to.fullPath } })
    }
  }

  next()
})

export default router

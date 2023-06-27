import { createRouter, createWebHashHistory } from 'vue-router';
import { useAppStore } from '@/stores/app';
import SystemRouter from './modules/system';
import NProgress from 'nprogress';
// 假设异步路由
export const asyncRoutes = [
  SystemRouter,
  {
    // 外链路由
    path: '/external-link',
    component: () => import('@/Layout/index.vue'),
    children: [
      {
        path: 'https://www.baidu.com/',
        redirect: '/',
        meta: {
          title: '去百度',
          icon: 'link',
        },
      },
    ],
  },
];
const constantRoutes = [
  {
    path: '/',
    name: 'home',
    redirect: '/home',
    component: () => import('@/Layout/index.vue'),
    children: [
      {
        path: '/home',
        name: 'home',
        component: () => import('@/views/Home/index.vue'),
        meta: {
          title: '首页',
          hidden: true, // 不需要再左边显示的
          affix: true,
        },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login/index.vue'),
    meta: {
      title: '登录',
      hidden: true,
    },
  },
];

export const routes = [...constantRoutes, ...asyncRoutes];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});
// 白名单
const whiteList = ['/login'];
router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore();
  NProgress.start();
  if (appStore.globalToken) {
    if (to.path === '/login') {
      NProgress.done();
      next('/');
    } else {
      // TODO 处理菜单
      NProgress.done();
      next();
    }
  } else {
    if (whiteList.indexOf(to.path) > -1) {
      next();
    } else {
      NProgress.done();
      next('/login');
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;

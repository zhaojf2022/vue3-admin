import { createRouter, createWebHashHistory } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { isHttp } from '@/utils';
import NProgress from 'nprogress';

// 假设异步路由
export const constantRoutes = [
  {
    path: '',
    name: 'home',
    redirect: '/home',
    component: () => import('@/Layout/index.vue'),
    meta: {
      hidden: true, // 不需要再左边显示的
    },
    hidden: true,
    children: [
      {
        path: 'home',
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
      isNotLayout: true,
      hidden: true,
    },
    hidden: true,
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});
// 白名单
const whiteList = ['/login', 'home'];
let isLoad = false;
router.beforeEach((to, form, next) => {
  const appStore = useAppStore();
  NProgress.start();
  if (appStore.globalToken) {
    if (to.path === '/login') {
      NProgress.done();
      next('/');
    } else {
      console.log(isLoad, '刷新');
      if (!isLoad) {
        isLoad = true;
        // 模拟后端请求的
        appStore
          .getMenusApi()
          .then((accessRoutes) => {
            console.log('请求路由', accessRoutes);
            accessRoutes.forEach((route) => {
              if (!isHttp(route.path)) {
                router.addRoute(route); // 动态添加可访问路由表
              }
            });
            next({ ...to, replace: true }); // hack方法 确保addRoutes已完成
          })
          .catch((err) => {
            next({ path: '/' });
          });
      } else {
        next();
      }
    }
  } else {
    if (whiteList.indexOf(to.path) != -1) {
      next();
    } else {
      next(`/login?redirect=${to.fullPath}`); // 否则全部重定向到登录页
      NProgress.done();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;

import { createRouter, createWebHashHistory } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { isHttp } from '@/utils';
import NProgress from 'nprogress';
import Layout from '@/Layout/index.vue';
// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../views/**/*.vue');
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
  {
    path: '/https://www.baidu.com/',
    name: 'https://www.baidu.com/',
    meta: {
      title: '去百度',
      icon: 'link',
      link: 'https://www.baidu.com/',
    },
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
router.beforeEach(async (to, form, next) => {
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

// 遍历后台传来的路由字符串，转换为组件对象
export function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter((route) => {
    if (type && route.children) {
      route.children = filterChildren(route.children);
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout;
      } else if (route.component === 'ParentView') {
        route.component = ParentView;
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink;
      } else {
        route.component = loadView(route.component);
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type);
    } else {
      delete route['children'];
      delete route['redirect'];
    }
    return true;
  });
}

function filterChildren(childrenMap, lastRouter = false) {
  var children = [];
  childrenMap.forEach((el, index) => {
    if (el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach((c) => {
          c.path = el.path + '/' + c.path;
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c));
            return;
          }
          children.push(c);
        });
        return;
      }
    }
    if (lastRouter) {
      el.path = lastRouter.path + '/' + el.path;
    }
    children = children.concat(el);
  });
  return children;
}
export const loadView = (view) => {
  let res;
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0];
    if (dir === view) {
      res = () => modules[path]();
    }
  }
  return res;
};
router.afterEach(() => {
  NProgress.done();
});

export default router;

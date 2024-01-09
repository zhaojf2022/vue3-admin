// 从当前目录src子目录中的index.vu文件中，引入 CustomTable 组件,
import CustomTable from './src/index.vue';

// 让这个组件可以通过use的形式使用
export default {
  install(app) {
    // 将CustomTable组件注册为 app 的同名组件。
    app.component('CustomTable', CustomTable);
  },
};

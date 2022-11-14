// 根据路由配置自动生成官网路由
import navConfig from './nav.config';
// 支持所有语言
import langs from './i18n/route';

/**
 * require.ensure实现webpack按需加载，避免将所有文件打包进一个bundle.js中导致文件过大
 * 语法：
 * require.ensure(
 *    dependencies:String[],// 依赖
 *    callback:function(require),//回调，所有依赖都加载完了会执行这个回调函数
 *    errorCalback:function(error),//错误回调
 *    chunkName:string// chunk名称
 * )
 * 可以被es6的import取代
 */
const LOAD_MAP = {
  'zh-CN': name => {
    return r => require.ensure([], () =>
      r(require(`./pages/zh-CN/${name}.vue`)),
    'zh-CN');
  },
  'en-US': name => {
    return r => require.ensure([], () =>
      r(require(`./pages/en-US/${name}.vue`)),
    'en-US');
  },
  'es': name => {
    return r => require.ensure([], () =>
      r(require(`./pages/es/${name}.vue`)),
    'es');
  },
  'fr-FR': name => {
    return r => require.ensure([], () =>
      r(require(`./pages/fr-FR/${name}.vue`)),
    'fr-FR');
  }
};

const load = function(lang, path) {
  return LOAD_MAP[lang](path);
};

// 加载官网页面各个组件的markdown文件
const LOAD_DOCS_MAP = {
  'zh-CN': path => {
    return r => require.ensure([], () =>
      r(require(`./docs/zh-CN${path}.md`)),
    'zh-CN');
  },
  'en-US': path => {
    return r => require.ensure([], () =>
      r(require(`./docs/en-US${path}.md`)),
    'en-US');
  },
  'es': path => {
    return r => require.ensure([], () =>
      r(require(`./docs/es${path}.md`)),
    'es');
  },
  'fr-FR': path => {
    return r => require.ensure([], () =>
      r(require(`./docs/fr-FR${path}.md`)),
    'fr-FR');
  }
};

const loadDocs = function(lang, path) {
  return LOAD_DOCS_MAP[lang](path);
};

const registerRoute = (navConfig) => {
  let route = [];
  // 遍历配置，生成四种语言的组件路由配置,lang表示语言，比如zh-CN
  Object.keys(navConfig).forEach((lang, index) => {
    // 指定语言的配置，比如 lang = zh-CN，navs 就是所有配置项都是中文写的
    let navs = navConfig[lang];
    // 组件页面 lang 语言的路由配置
    route.push({
      path: `/${ lang }/component`,
      redirect: `/${ lang }/component/installation`,
      // 按需引入./pages/zh-CN/components.vue组件
      component: load(lang, 'component'),
      // 组件页的所有子路由，即各个组件，放这里，最后的路由就是 /zh-CN/component/comp-path
      children: []
    });
    navs.forEach(nav => {
      if (nav.href) return;
      if (nav.groups) {
        // 该项为组件
        nav.groups.forEach(group => {
          group.list.forEach(nav => {
            addRoute(nav, lang, index);
          });
        });
      } else if (nav.children) {
        // 该项为开发指南
        nav.children.forEach(nav => {
          addRoute(nav, lang, index);
        });
      } else {
        // 其他，比如更新日志等
        addRoute(nav, lang, index);
      }
    });
  });
  /**
   * 生成子路由配置，并填充到 children 中
   * @param {*} page 
   * 格式为{
   *   name?:string 开发指南、更新日志等具有该属性
   *   path:string
   *   title?:string // 组件固有
   * }
   * @param {*} lang 
   * @param {*} index 
   */
  function addRoute(page, lang, index) {
    // 根据 path 决定是加载vue文件还是加载markdown文件
    const component = page.path === '/changelog'
      ? load(lang, 'changelog')
      : loadDocs(lang, page.path);
    let child = {
      // 去除路由配置中path的/，形成符合子路由的形式，比如：/table->table
      path: page.path.slice(1),
      meta: {
        title: page.title || page.name,
        description: page.description,
        lang
      },
      name: 'component-' + lang + (page.title || page.name),
      component: component.default || component
    };
    // 将子路由添加在上面的children中
    route[index].children.push(child);
  }

  return route;
};

// 得到组件页面所有侧边栏的路由配置
let route = registerRoute(navConfig);

// 官网配置指南、主题、资源、首页路由配置
const generateMiscRoutes = function(lang) {
  let guideRoute = {
    path: `/${ lang }/guide`, // 指南
    redirect: `/${ lang }/guide/design`,
    component: load(lang, 'guide'),
    children: [{
      path: 'design', // 设计原则
      name: 'guide-design' + lang,
      meta: { lang },
      component: load(lang, 'design')
    }, {
      path: 'nav', // 导航
      name: 'guide-nav' + lang,
      meta: { lang },
      component: load(lang, 'nav')
    }]
  };

  let themeRoute = {
    path: `/${ lang }/theme`,
    component: load(lang, 'theme-nav'),
    children: [
      {
        path: '/', // 主题管理
        name: 'theme' + lang,
        meta: { lang },
        component: load(lang, 'theme')
      },
      {
        path: 'preview', // 主题预览编辑
        name: 'theme-preview-' + lang,
        meta: { lang },
        component: load(lang, 'theme-preview')
      }]
  };

  let resourceRoute = {
    path: `/${ lang }/resource`, // 资源
    meta: { lang },
    name: 'resource' + lang,
    component: load(lang, 'resource')
  };

  let indexRoute = {
    path: `/${ lang }`, // 首页
    meta: { lang },
    name: 'home' + lang,
    component: load(lang, 'index')
  };

  return [guideRoute, resourceRoute, themeRoute, indexRoute];
};

langs.forEach(lang => {
  route = route.concat(generateMiscRoutes(lang.lang));
});

route.push({
  path: '/play',
  name: 'play',
  component: require('./play/index.vue')
});

// 设置语言格式，默认采用英文
let userLanguage = localStorage.getItem('ELEMENT_LANGUAGE') || window.navigator.language || 'en-US';
let defaultPath = '/en-US';
if (userLanguage.indexOf('zh-') !== -1) {
  defaultPath = '/zh-CN';
} else if (userLanguage.indexOf('es') !== -1) {
  defaultPath = '/es';
} else if (userLanguage.indexOf('fr') !== -1) {
  defaultPath = '/fr-FR';
}

route = route.concat([{
  path: '/',
  redirect: defaultPath
}, {
  path: '*',
  redirect: defaultPath
}]);

export default route;

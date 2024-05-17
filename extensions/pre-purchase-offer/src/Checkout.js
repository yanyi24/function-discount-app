import {
  extension,
  Text,
  InlineLayout,
  BlockStack,
  Divider,
  Image,
  Banner,
  Heading,
  Button,
  SkeletonImage,
  SkeletonText,
} from "@shopify/ui-extensions/checkout";
// 设置扩展的入口点
export default extension(
  "purchase.checkout.shipping-option-list.render-after",
  async (root, { lines, applyCartLinesChange, query, i18n }) => {
    let products = [];
    let loading = true;
    let appRendered = false;
    let cartLineId = null;
    let productState = null;

    

    // 从服务器获取产品信息
    const fetchResult = await fetchProducts(query);
    products = fetchResult;
    loading = false;
    cartLineId = findCartLineId(lines, products);
    // 订阅购物车行的变化
    lines.subscribe(() => {
      cartLineId = findCartLineId(lines, products);
      appRendered = false;
    
      if (productState) {
        root.removeChild(productState)
      }
      renderApp()
    });
    renderApp();
    // 渲染应用程序
    function renderApp() {
      if (loading) {
        return;
      }
      // 创建加载状态组件
      const loadingState = createLoadingState(root);
      if (loading) {
        root.appendChild(loadingState);
      }
      // 创建产品组件
      productState = createProductComponents(root);
      const { imageComponent, titleMarkup, priceMarkup, merchandise } = productState;
      // 创建添加组件
      const addButtonComponent = createAddButtonComponent(
        root,
        applyCartLinesChange,
        merchandise,
        cartLineId
      );
      // 创建应用组件
      const app = createApp(
        root,
        imageComponent,
        titleMarkup,
        priceMarkup,
        addButtonComponent
      );
      // 如果没有产品，则移除加载状态组件
      if (!loading && products.length === 0) {
        root.removeChild(loadingState);
        return;
      }
      // 过滤购物车中的产品
      const productsOnOffer = filterProductsOnOffer(lines, products);
      if (!loading && productsOnOffer.length === 0) {
        if (loadingState.parent) root.removeChild(loadingState);
        // if (root.children && root.children[0]) root.removeChild(root.children[0]);
        // return;
      }
      // 更新产品组件
      updateProductComponents(
        products[0],
        imageComponent,
        titleMarkup,
        priceMarkup,
        addButtonComponent,
        merchandise,
        i18n
      );
      // 如果应用尚未渲染，则渲染它
      if (!appRendered) {
        if (loadingState.parent) root.removeChild(loadingState);
        root.appendChild(app);
        appRendered = true;
      }
    }
  }
);
// 从服务器获取产品数据的函数
function fetchProducts(query) {
  return query(
    `query ($first: Int!, $query: String!) {
        products(first: $first, query: $query) {
          nodes {
            id
            title
            images(first:1){
              nodes {
                url
              }
            }
            variants(first: 1) {
              nodes {
                id
                price {
                  amount
                }
              }
            }
          }
        }
      }`,
    {
      variables: { first: 1, query: "tag:Deliver guarantee" },
    }
  )
    .then(({ data }) => data.products.nodes)
    .catch((err) => {
      console.error(err);
      return [];
    });
}
// 创建加载状态组件
function createLoadingState(root) {
  return root.createComponent(BlockStack, { spacing: "loose" }, [
    root.createComponent(Divider),
    root.createComponent(Heading, { level: 2 }, ["test title"]),
    root.createComponent(BlockStack, { spacing: "loose" }, [
      root.createComponent(
        InlineLayout,
        {
          spacing: "base",
          columns: [64, "fill", "auto"],
          blockAlignment: "center",
        },
        [
          root.createComponent(SkeletonImage, { aspectRatio: 1 }),
          root.createComponent(BlockStack, { spacing: "none" }, [
            root.createComponent(SkeletonText, { inlineSize: "large" }),
            root.createComponent(SkeletonText, { inlineSize: "small" }),
          ]),
          root.createComponent(Button, { kind: "secondary", disabled: true }, [
            root.createText("Add"),
          ]),
        ]
      ),
    ]),
  ]);
}
// 创建产品组件
function createProductComponents(root) {
  const imageComponent = root.createComponent(Image, {
    border: "base",
    borderWidth: "base",
    borderRadius: "loose",
    aspectRatio: 1,
    source: "",
  });
  const titleMarkup = root.createText("");
  const priceMarkup = root.createText("");
  const merchandise = { id: "" };

  return { imageComponent, titleMarkup, priceMarkup, merchandise };
}
// 创建添加按钮组件
function createAddButtonComponent(root, applyCartLinesChange, merchandise, cartLineId) {
  return root.createComponent(
    Button,
    {
      kind: "secondary",
      loading: false,
      onPress: async () => {
        await handleAddButtonPress(root, applyCartLinesChange, merchandise, cartLineId);
      },
    },
    [cartLineId ? "Remove" : "Add"]
  );
}
// 处理添加按钮按下事件
async function handleAddButtonPress(root, applyCartLinesChange, merchandise, cartLineId) {
  const type = cartLineId ? 'removeCartLine' : "addCartLine";
  const params = cartLineId ? {id: cartLineId} : {merchandiseId: merchandise.id};
  const result = await applyCartLinesChange({
    type,
    ...params,
    quantity: 1,
  });

  if (result.type === "error") {
    displayErrorBanner(
      root,
      "There was an issue adding this product. Please try again."
    );
  }
}
// 显示错误横幅
function displayErrorBanner(root, message) {
  const errorComponent = root.createComponent(Banner, { status: "critical" }, [
    message,
  ]);
  const topLevelComponent = root.children[0];
  topLevelComponent.appendChild(errorComponent);
  setTimeout(() => topLevelComponent.removeChild(errorComponent), 3000);
}
// 创建应用组件
function createApp(
  root,
  imageComponent,
  titleMarkup,
  priceMarkup,
  addButtonComponent
) {
  return root.createComponent(BlockStack, { spacing: "loose" }, [
    root.createComponent(Divider),
    root.createComponent(Heading, { level: 2 }, "test title"),
    root.createComponent(BlockStack, { spacing: "loose" }, [
      root.createComponent(
        InlineLayout,
        {
          spacing: "base",
          columns: [64, "fill", "auto"],
          blockAlignment: "center",
        },
        [
          imageComponent,
          root.createComponent(BlockStack, { spacing: "none" }, [
            root.createComponent(Text, { size: "medium", emphasis: "strong" }, [
              titleMarkup,
            ]),
            root.createComponent(Text, { appearance: "subdued" }, [
              priceMarkup,
            ]),
          ]),
          addButtonComponent,
        ]
      ),
    ]),
  ]);
}
function findCartLineId(lines, products) {  
  if( !products.length) return null;

  const {id} = products[0].variants.nodes[0];
  const lineItem = lines.current.find(item => item.merchandise.id === id);

  return lineItem ? lineItem.id : null;
}
// 过滤已经在购物车中的产品
function filterProductsOnOffer(lines, products) {
  const cartLineProductVariantIds = lines.current.map(
    (item) => item.merchandise.id
  );
  return products.filter((product) => {
    const isProductVariantInCart = product.variants.nodes.some(({ id }) =>
      cartLineProductVariantIds.includes(id)
    );
    return !isProductVariantInCart;
  });
}
// 更新产品组件
function updateProductComponents(
  product,
  imageComponent,
  titleMarkup,
  priceMarkup,
  addButtonComponent,
  merchandise,
  i18n
) {
  const { images, title, variants } = product;

  const renderPrice = i18n.formatCurrency(variants.nodes[0].price.amount);

  const imageUrl =
    images.nodes[0]?.url ??
    "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png?format=webp&v=1530129081";

  imageComponent.updateProps({ source: imageUrl });
  titleMarkup.updateText(title);
  addButtonComponent.updateProps({
    accessibilityLabel: `Add ${title} to cart,`,
  });
  priceMarkup.updateText(renderPrice);
  merchandise.id = variants.nodes[0].id;
}

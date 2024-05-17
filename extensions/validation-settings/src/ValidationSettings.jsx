import { useState } from "react";

import {
  reactExtension,
  useApi,
  Section,
  NumberField,
  Box,
  InlineStack,
  Text,
  BlockStack,
  Banner,
  Image,
  FunctionSettings,
} from "@shopify/ui-extensions-react/admin";

const TARGET = "admin.settings.validation.render";

export default reactExtension(
  TARGET,
  async (api) => {
    const configuration = JSON.parse(
      api.data.validation?.metafields?.[0]?.value ?? "{}"
    );

    const products = await getProducts();

    return (
      <ValidationSettings
        configuration={configuration}
        products={products}
      />
    );
  }
);

function ValidationSettings({
  configuration,
  products,
}) {
  const [errors, setErrors] = useState([]);

  const {
    applyMetafieldChange,
  } = useApi(TARGET);

  const settings = {};

  products.forEach(({ variants }) => {
    variants.forEach(({ id }) => {
      const limit = configuration[id] ?? 5;
      settings[id] = limit;
    });
  });

  return (
    <FunctionSettings
      onError={(errors) => {
        // @ts-ignore
        setErrors(errors.map((e) => e.message));
      }}
    >
      <Box paddingBlockEnd="large">
        {errors.length
          ? errors.map((error, i) => (
              <Banner
                key={i}
                title="Errors were encountered"
                dismissible
                tone="critical"
              >
                <Box>{error}</Box>
              </Banner>
            ))
          : ""}
          <BlockStack gap="large">
            {// display each product and variant's settings
            products.map(({ title, variants }) => {
              return (
                <Section heading={title} key={title}>
                  <BlockStack paddingBlock="large">
                    <InlineStack>
                      <Box minInlineSize="10%" />
                      <Box minInlineSize="5%">
                        <Text fontWeight="bold">Variant Name</Text>
                      </Box>
                      <Box minInlineSize="50%">
                        {" "}
                        <Text fontWeight="bold">Limit</Text>
                      </Box>
                    </InlineStack>
                    {variants.map((variant) => {
                      const limit = settings[variant.id];
                      return (
                        <InlineStack columnGap="none" key={variant.id}>
                          <Box minInlineSize="5%">
                            {variant.imageUrl && (
                              <Image
                                alt={variant.title}
                                source={variant.imageUrl}
                              />
                            )}
                          </Box>
                          <Box minInlineSize="5%">
                            <Text>{variant.title}</Text>
                          </Box>
                          <Box minInlineSize="50%">
                            <NumberField
                              value={limit}
                              min={0}
                              max={99}
                              label="Set a limit"
                              defaultValue={String(limit)}
                              onChange={async (value) => {
                                setErrors([]);
                                const newSettings = {
                                  ...settings,
                                  [variant.id]: value,
                                };

                                const results = await applyMetafieldChange({
                                  type: "updateMetafield",
                                  namespace: "$app:my-validation-namespace",
                                  key: "my-configuration-key",
                                  value: JSON.stringify(newSettings),
                                });

                                if (results.type === "error") {
                                  // @ts-ignore
                                  setErrors([results.message]);
                                }
                              }}
                            />
                          </Box>
                        </InlineStack>
                      );
                    })}
                  </BlockStack>
                </Section>
              );
            })}
          </BlockStack>
      </Box>
    </FunctionSettings>
  );
}

async function getProducts() {
  const query = `#graphql
    query FetchProducts {
      products(first: 5) {
        nodes {
          title
          variants(first: 5) {
            nodes {
              id
              title
              image(maxHeight: 100) {
                url
              }
            }
          }
        }
      }
    }`;

  const results = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    body: JSON.stringify({ query }),
  }).then((res) => res.json());

  return results?.data?.products?.nodes?.map(({ title, variants }) => {
    return {
      title,
      variants: variants.nodes.map((variant) => ({
        title: variant.title,
        id: variant.id,
        imageUrl: variant?.image?.url,
      })),
    };
  });
}

import {
  Banner,
  useApi,
  useTranslate,
  reactExtension,
  useCartLineTarget,
  Text,
  useAppMetafields,
} from '@shopify/ui-extensions-react/checkout';
import { useEffect, useState } from 'react';

export default reactExtension(
  'purchase.checkout.cart-line-item.render-after',
  () => <Extension />,
);

function Extension() {
  const wateringMetafields = useAppMetafields({
    type: 'product',
    namespace: 'instructions',
    key: 'watering'
  });

  const cartLineTarget = useCartLineTarget();
  const [wateringInstructions, setWateringInstructions] = useState("");

  useEffect(() => {
    const productId = cartLineTarget?.merchandise?.product?.id;
    if(!productId) return;

    const wateringMetafield = wateringMetafields.find(({target}) => {
      // Check if the target of the metafield is the product from our cart line
      return `gid://shopify/Product/${target.id}` === productId;
    });


    if (typeof wateringMetafield?.metafield?.value === "string") {
      setWateringInstructions(wateringMetafield.metafield.value);
    }
  }, [cartLineTarget, wateringMetafields])

  if (wateringInstructions) {
    return (
        <Text>
          {wateringInstructions}
        </Text>
      );
  }

  return null;
}
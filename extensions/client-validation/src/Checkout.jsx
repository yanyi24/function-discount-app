import {
  Banner,
  useApi,
  TextField,
  reactExtension,
  useExtensionCapability,
  useBuyerJourneyIntercept
} from '@shopify/ui-extensions-react/checkout';
import { useState } from 'react';

export default reactExtension(
  'purchase.checkout.contact.render-after',
  () => <Extension />,
);

function Extension() {
  const ageTarget = 18;

  const [age, setAge] = useState('');
  const [validationError, setValidationError] = useState('');

  const canBlockProgress = useExtensionCapability('block_progress');
  const label = canBlockProgress ? "Your age" : "Your age (optional)";

  useBuyerJourneyIntercept(({canBlockProgress}) => {
    if (canBlockProgress && !isAgeSet()) {
      return {
        behavior: 'block',
        reason: 'Age is required',
        perform: (res) => {
          if (res.behavior === 'block') {
            setValidationError('Enter your age')
          }
        }
      }
    }
    if (canBlockProgress && !isAgeValid()) {
      return {
        behavior: "block",
        reason: `Age is less than ${ageTarget}.`,
        errors: [
          {
            message:
              "You're not legally old enough to buy some of the items in your cart.",
          },
        ],
      };
    }
    return {
      behavior: "allow",
      perform: () => {
        clearValidationErrors();
      },
    };
  });

  function isAgeSet() {
    return age !== "";
  }

  function isAgeValid() {
    return Number(age) >= ageTarget;
  }

  function clearValidationErrors() {
    setValidationError("");
  }
  return (
    <TextField
      label={label}
      type="number"
      value={age}
      onChange={setAge}
      onInput={clearValidationErrors}
      required={canBlockProgress}
      error={validationError}
  />
  );
}
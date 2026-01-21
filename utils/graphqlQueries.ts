// utils/graphqlQueries.ts
export const graphqlQueries = {
  cartDetails: `
    query cartDetail {
      cartDetail {
        id
        couponCode
        itemsCount
        itemsQty
        taxTotal
        customerEmail
        customerFirstName
        customerLastName
        appliedTaxRates {
          taxName
          totalAmount
        }
        items {
          id
          quantity
          type
          name
          additional
          formattedPrice {
            price
            total
            taxAmount
            discountAmount
          }
          product {
            id
            type
            sku
            urlKey
            parentId
            images {
              id
              type
              path
              url
              productId
            }
          }
        }
        formattedPrice {
          grandTotal
          baseGrandTotal
          subTotal
          taxTotal
          discountAmount
          discountedSubTotal
        }
      }
    }
  `,

  addToCart: (input: any) => {
    const inputFields: string[] = [];

    if (input.productId) inputFields.push(`productId: "${input.productId}"`);
    if (input.quantity) inputFields.push(`quantity: ${input.quantity}`);
    if (input.selectedConfigurableOption)
      inputFields.push(
        `selectedConfigurableOption: "${input.selectedConfigurableOption}"`,
      );
    if (input.superAttribute && input.superAttribute.length > 0) {
      inputFields.push(`superAttribute: ${JSON.stringify(input.superAttribute)}`);
    }
    if (input.bundleOptions && input.bundleOptions.length > 0) {
      inputFields.push(`bundleOptions: ${JSON.stringify(input.bundleOptions)}`);
    }
    if (input.customizableOptions && input.customizableOptions.length > 0) {
      inputFields.push(
        `customizableOptions: ${JSON.stringify(input.customizableOptions)}`,
      );
    }
    if (input.links && input.links.length > 0) {
      inputFields.push(`links: ${JSON.stringify(input.links)}`);
    }
    if (input.booking && Object.keys(input.booking).length > 0) {
      inputFields.push(`booking: ${JSON.stringify(input.booking)}`);
    }

    const inputString = inputFields.join("\n          ");

    return `
      mutation addItemToCart {
        addItemToCart(input: {
          ${inputString}
        }) {
          success
          message
          cart {
            id
            itemsCount
            couponCode
            itemsQty
            taxTotal
          }
        }
      }
    `;
  },

  updateCartItem: `
    mutation updateItemToCart($input: UpdateItemToCartInput!) {
      updateItemToCart(input: $input) {
        success
        message
      }
    }
  `,

  removeFromCart: `
    mutation removeCartItem($id: ID!) {
      removeCartItem(id: $id) {
        success
        message
      }
    }
  `,

  applyCoupon: `
    mutation applyCoupon($code: String!) {
      applyCoupon(input: { code: $code }) {
        success
        message
      }
    }
  `,

  removeCoupon: `
    mutation removeCoupon {
      removeCoupon {
        success
        message
      }
    }
  `,

  getOrdersList: (
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: string;
      orderDateFrom?: string;
      orderDateTo?: string;
      incrementId?: string;
    } = {},
  ) => {
    const filterFields: string[] = [];
    if (filters.incrementId) filterFields.push(`incrementId: "${filters.incrementId}"`);
    if (filters.orderDateFrom) filterFields.push(`orderDateFrom: "${filters.orderDateFrom}"`);
    if (filters.orderDateTo) filterFields.push(`orderDateTo: "${filters.orderDateTo}"`);
    if (filters.status) filterFields.push(`status: "${filters.status}"`);

    return `
      query ordersList {
        ordersList(
          page: ${page}
          first: ${limit}
          input: {
            ${filterFields.length > 0 ? filterFields.join("\n            ") : ""}
          }
        ) {
          paginatorInfo {
            count
            currentPage
            lastPage
            total
          }
          data {
            id
            incrementId
            status
            totalQtyOrdered
            createdAt
            formattedPrice {
              grandTotal
              subTotal
              discountAmount
              taxAmount
              shippingAmount
            }
          }
        }
      }
    `;
  },

  getOrderDetail: `
    query orderDetail($id: ID!) {
      orderDetail(id: $id) {
        id
        incrementId
        status
        shippingTitle
        createdAt
        billingAddress {
          id
          firstName
          lastName
          companyName
          address
          postcode
          city
          state
          country
          phone
        }
        shippingAddress {
          id
          firstName
          lastName
          companyName
          address
          postcode
          city
          state
          country
          phone
        }
        items {
          id
          sku
          type
          name
          qtyOrdered
          qtyShipped
          qtyInvoiced
          qtyCanceled
          qtyRefunded
          additional
          formattedPrice {
            price
            total
            baseTotal
            discountAmount
            taxAmount
          }
          product {
            id
            sku
            images {
              id
              url
              productId
            }
          }
        }
        payment {
          id
          method
          methodTitle
        }
        formattedPrice {
          grandTotal
          subTotal
          taxAmount
          discountAmount
          shippingAmount
        }
      }
    }
  `,

  cancelOrder: (orderId: string) => `
    mutation cancelCustomerOrder {
      cancelCustomerOrder(id: "${orderId}") {
        success
        message
      }
    }
  `,

  reorder: (orderId: string) => `
    mutation reorder {
      reorder(id: "${orderId}") {
        success
        message
      }
    }
  `,

  paymentMethods: `
    query paymentMethods($shippingMethod: String) {
      paymentMethods(input: { shippingMethod: $shippingMethod }) {
        message
        paymentMethods {
          method
          methodTitle
          description
          sort
        }
        cart {
          id
          customerEmail
          customerFirstName
          customerLastName
          shippingMethod
          couponCode
          isGift
          itemsCount
          itemsQty
          formattedPrice {
            grandTotal
          }
        }
      }
    }
  `,

  saveCheckoutAddresses: `
    mutation saveCheckoutAddresses($input: SaveCheckoutAddressesInput!) {
      saveCheckoutAddresses(input: $input) {
        message
        shippingMethods {
          title
          methods {
            code
            formattedPrice
          }
        }
        paymentMethods {
          method
          methodTitle
        }
        cart {
          id
          customerEmail
          customerFirstName
          customerLastName
          shippingMethod
          couponCode
          isGift
          itemsCount
          itemsQty
          formattedPrice {
            grandTotal
          }
        }
        jumpToSection
      }
    }
  `,

  savePayment: `
    mutation savePayment($method: String!) {
      savePayment(input: { method: $method }) {
        jumpToSection
        cart {
          id
          couponCode
          itemsCount
          itemsQty
          grandTotal
          appliedTaxRates {
            taxName
            totalAmount
          }
          items {
            id
            quantity
            appliedTaxRate
            price
            formattedPrice {
              price
              total
            }
            type
            name
            productId
            product {
              id
              type
              sku
              parentId
              images {
                url
              }
            }
          }
          formattedPrice {
            grandTotal
            subTotal
            taxTotal
            discountAmount
          }
          shippingAddress {
            id
            address
            postcode
            city
            state
            country
            phone
          }
          billingAddress {
            id
            address
            postcode
            city
            state
            country
            phone
          }
          selectedShippingRate {
            id
            methodTitle
            formattedPrice {
              price
              basePrice
            }
          }
          payment {
            id
            method
            methodTitle
          }
        }
      }
    }
  `,

  placeOrder: `
    mutation placeOrder(
      $isPaymentCompleted: Boolean
      $paymentMethod: String
      $paymentType: String
      $paymentStatus: String
      $error: Boolean
      $message: String
      $transactionId: String
      $orderID: String
    ) {
      placeOrder(
        isPaymentCompleted: $isPaymentCompleted
        paymentMethod: $paymentMethod
        paymentType: $paymentType
        paymentStatus: $paymentStatus
        error: $error
        message: $message
        transactionId: $transactionId
        orderID: $orderID
      ) {
        success
        redirectUrl
        order {
          id
          incrementId
        }
      }
    }
  `,

  allProducts: (params: {
    page: number;
    limit: number;
    categorySlug?: string;
    sort?: string;
    filters?: any;
  }) => {
    const { page = 1, limit = 15, categorySlug, sort, filters = {} } = params;
    
    const filterArray = [];
    
    if (categorySlug) filterArray.push({ key: '"categorySlug"', value: `"${categorySlug}"` });
    if (sort) filterArray.push({ key: '"sort"', value: `"${sort}"` });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          filterArray.push({ key: `"${key}"`, value: `"${value}"` });
        }
      });
    }
    
    // Add pagination filters
    filterArray.push({ key: '"page"', value: `"${page}"` });
    filterArray.push({ key: '"limit"', value: `"${limit}"` });
    
    const filterString = JSON.stringify(filterArray);
    
    return `
      query allProducts {
        allProducts(input: ${filterString}) {
          paginatorInfo {
            count
            currentPage
            lastPage
            total
          }
          data {
            id
            type
            isInWishlist
            isInSale
            isSaleable
            name
            shareURL
            urlKey
            shortDescription
            description
            customizableOptions {
              id
              label
              productId
              type
              isRequired
              maxCharacters
              supportedFileExtensions
              product {
                id
              }
              translations {
                id
                label
              }
              customizableOptionPrices {
                id
                label
                price
              }
            }
            additionalData {
              id
              label
              value
              type
            }
            priceHtml {
              id
              type
              priceHtml
              regularPrice
              formattedRegularPrice
              finalPrice
              formattedFinalPrice
            }
            configurableData {
              attributes {
                id
                code
                label
                swatchType
                options {
                  id
                  label
                  swatchType
                  swatchValue
                }
              }
              index {
                id
                attributeOptionIds {
                  attributeId
                  attributeCode
                  attributeOptionId
                }
              }
              variantPrices {
                id
                regularPrice {
                  price
                  formattedPrice
                }
                finalPrice {
                  price
                  formattedPrice
                }
              }
            }
            sku
            parentId
            variants {
              id
              type
              sku
            }
            attributeFamily {
              id
            }
            superAttributes {
              id
              code
              adminName
              type
              position
            }
            images {
              id
              type
              url
              productId
            }
            averageRating
            percentageRating
            reviews {
              id
              title
              rating
              comment
              createdAt
            }
            groupedProducts {
              id
              qty
              associatedProductId
              associatedProduct {
                id
                name
                type
                sku
                priceHtml {
                  id
                  type
                  priceHtml
                  regularPrice
                  formattedRegularPrice
                  finalPrice
                  formattedFinalPrice
                }
              }
            }
            downloadableSamples {
              id
              fileName
              translations {
                id
                title
              }
            }
            downloadableLinks {
              id
              title
              price
              url
              file
              fileName
              type
              sampleUrl
              sampleFile
              sampleFileUrl
              sampleFileName
              sampleType
              sortOrder
              productId
              downloads
              translations {
                id
                title
              }
            }
            bundleOptions {
              id
              type
              isRequired
              sortOrder
              productId
              bundleOptionProducts {
                id
                qty
                isUserDefined
                sortOrder
                isDefault
                productBundleOptionId
                productId
                product {
                  sku
                  name
                  id
                  priceHtml {
                    id
                    type
                    priceHtml
                    regularPrice
                    formattedRegularPrice
                    finalPrice
                    formattedFinalPrice
                  }
                }
              }
              translations {
                id
                locale
                label
                productBundleOptionId
              }
            }
            booking {
              id
              type
              qty
              location
              showLocation
              availableEveryWeek
              availableFrom
              availableTo
              productId
              product {
                id
              }
              defaultSlot {
                id
                bookingType
                duration
                breakTime
                slotManyDays {
                  to
                  from
                }
                slotOneDay {
                  id
                  to
                  from
                }
              }
              appointmentSlot {
                id
                duration
                breakTime
                sameSlotAllDays
                slotManyDays {
                  to
                  from
                }
                slotOneDay {
                  id
                  to
                  from
                }
              }
              eventTickets {
                id
                price
                qty
                name
                description
                specialPrice
                specialPriceFrom
                specialPriceTo
                translations {
                  locale
                  name
                  description
                }
              }
              rentalSlot {
                id
                rentingType
                dailyPrice
                hourlyPrice
                sameSlotAllDays
                slotManyDays {
                  to
                  from
                }
                slotOneDay {
                  id
                  to
                  from
                }
              }
              tableSlot {
                id
                priceType
                guestLimit
                duration
                breakTime
                preventSchedulingBefore
                sameSlotAllDays
                slotManyDays {
                  to
                  from
                }
                slotOneDay {
                  id
                  to
                  from
                }
              }
            }
          }
        }
      }
    `;
  },

  productDetail: (productId: string) => `
    query product {
      product(id: "${productId}") {
        id
        type
        isInWishlist
        isInSale
        isSaleable
        name
        shareURL
        urlKey
        shortDescription
        description
        customizableOptions {
          id
          label
          productId
          type
          isRequired
          maxCharacters
          supportedFileExtensions
          product {
            id
          }
          translations {
            id
            label
          }
          customizableOptionPrices {
            id
            label
            price
          }
        }
        additionalData {
          id
          label
          value
          type
        }
        priceHtml {
          id
          type
          priceHtml
          regularPrice
          formattedRegularPrice
          finalPrice
          formattedFinalPrice
        }
        configurableData {
          attributes {
            id
            code
            label
            swatchType
            options {
              id
              label
              swatchType
              swatchValue
            }
          }
          index {
            id
            attributeOptionIds {
              attributeId
              attributeCode
              attributeOptionId
            }
          }
          variantPrices {
            id
            regularPrice {
              price
              formattedPrice
            }
            finalPrice {
              price
              formattedPrice
            }
          }
        }
        sku
        parentId
        variants {
          id
          type
          sku
        }
        attributeFamily {
          id
        }
        superAttributes {
          id
          code
          adminName
          type
          position
        }
        images {
          id
          type
          url
          productId
        }
        averageRating
        percentageRating
        reviews {
          id
          title
          rating
          comment
          createdAt
        }
        groupedProducts {
          id
          qty
          associatedProductId
          associatedProduct {
            id
            name
            type
            sku
            priceHtml {
              id
              type
              priceHtml
              regularPrice
              formattedRegularPrice
              finalPrice
              formattedFinalPrice
            }
          }
        }
        downloadableSamples {
          id
          fileName
          translations {
            id
            title
          }
        }
        downloadableLinks {
          id
          title
          price
          url
          file
          fileName
          type
          sampleUrl
          sampleFile
          sampleFileUrl
          sampleFileName
          sampleType
          sortOrder
          productId
          downloads
          translations {
            id
            title
          }
        }
        bundleOptions {
          id
          type
          isRequired
          sortOrder
          productId
          bundleOptionProducts {
            id
            qty
            isUserDefined
            sortOrder
            isDefault
            productBundleOptionId
            productId
            product {
              sku
              name
              id
              priceHtml {
                id
                type
                priceHtml
                regularPrice
                formattedRegularPrice
                finalPrice
                formattedFinalPrice
              }
            }
          }
          translations {
            id
            locale
            label
            productBundleOptionId
          }
        }
        booking {
          id
          type
          qty
          location
          showLocation
          availableEveryWeek
          availableFrom
          availableTo
          productId
          product {
            id
          }
          defaultSlot {
            id
            bookingType
            duration
            breakTime
            slotManyDays {
              to
              from
            }
            slotOneDay {
              id
              to
              from
            }
          }
          appointmentSlot {
            id
            duration
            breakTime
            sameSlotAllDays
            slotManyDays {
              to
              from
            }
            slotOneDay {
              id
              to
              from
            }
          }
          eventTickets {
            id
            price
            qty
            name
            description
            specialPrice
            specialPriceFrom
            specialPriceTo
            translations {
              locale
              name
              description
            }
          }
          rentalSlot {
            id
            rentingType
            dailyPrice
            hourlyPrice
            sameSlotAllDays
            slotManyDays {
              to
              from
            }
            slotOneDay {
              id
              to
              from
            }
          }
          tableSlot {
            id
            priceType
            guestLimit
            duration
            breakTime
            preventSchedulingBefore
            sameSlotAllDays
            slotManyDays {
              to
              from
            }
            slotOneDay {
              id
              to
              from
            }
          }
        }
      }
    }
  `,
};
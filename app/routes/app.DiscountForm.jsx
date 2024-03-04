import React, { useState, useCallback, useEffect } from 'react';
import { SearchIcon, CashRupeeIcon, DiscountFilledIcon, DiscountIcon } from '@shopify/polaris-icons';
import { Page, DatePicker, Button, Toast, Frame, FormLayout, TextField, Select, Card, Icon, Text, List, Banner, Badge } from '@shopify/polaris';
import axios from 'axios';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import "../style/discountForm.css"

const DiscountForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false)
  const [showToast, setShowToast] = useState({ active: false, message: "", error: "", type: "default" });
  const [selectBuyProduct, setSelectBuyProduct] = useState(null);
  const [selectGetProduct, setSelectGetProduct] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [title, setTitle] = useState('');
  const [selectOffer, setSelectOffer] = useState('Percent');
  const [checkActive, setCheckActive] = useState("");
  const [showOfferDatesAndTime, setShowOfferDatesAndTime] = useState({
    offerStartDate: {
      date: null
    },
    offerEndDate: {
      date: null
    },
    offerEndTime: {
      time: null
    }
  })

  // =============================== Date =============================== //
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const [{ month, year }, setDate] = useState({ month: currentMonth, year: currentYear });
  const [selectedDates, setSelectedDates] = useState({
    end: null,
  });

  const handleDateChange = (date) => {
    setSelectedDates({ ...date });
  };

  const handleMonthChange = useCallback(
    (month, year) => setDate({ month, year }),
    []
  );

  // =============================== resource picker for product =============================== //
  const selectProducts = async (e) => {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: false,
    });
    // console.log("products ===", products);
    const id = products[0].id;
    const productTitle = products[0].title
    const variantId = products[0].variants[0].id;
    const price = products[0].variants[0].price

    if (e.target.name === "buyProduct") {
      setSelectBuyProduct(prevState => ({
        ...prevState,
        productID: id,
        productTitle: productTitle,
        variantId: variantId,
        price: price
      }));
    } else if (e.target.name === "getProduct") {
      setSelectGetProduct(prevState => ({
        ...prevState,
        productID: id,
        productTitle: productTitle,
        variantId: variantId,
        price: price
      }));
    }

  }

  // =============================== CREATE OFFER =============================== //
  const createOffer = async () => {
    if (title.length < 4) {
      setShowToast({
        active: true,
        message: "Title should be greater then 4 letters",
        error: "",
        type: "error"
      });
      return;
    } else if (selectBuyProduct === null || selectGetProduct === null) {
      setShowToast({
        active: true,
        message: "Please select the products",
        error: "",
        type: "error"
      });
      return;
    } else if (selectOffer === "Percent" && Number(discountPercent) <= 0 || Number(discountPercent) > 99) {
      setShowToast({
        active: true,
        message: "Discount Should greater than 0 and less than 100",
        error: "",
        type: "error"
      });
      return;
    } else if (selectOffer === "Amount" && Number(discountPercent) > Number(selectGetProduct.price)) {
      setShowToast({
        active: true,
        message: "Product price is less than offer amount",
        error: "",
        type: "error"
      });
      return;
    } else if (discountPercent === undefined) {
      setShowToast({
        active: true,
        message: "Discount value can't be blank",
        error: "",
        type: "error"
      });
      return
    };

    const formData = {
      BuyProduct: selectBuyProduct,
      GetProduct: selectGetProduct,
      discountPercent: discountPercent,
      offerTitle: title.toUpperCase(),
      endDate: selectedDates.end ? selectedDates.end : null,
      selectOffer: selectOffer
    };

    try {
      setLoading(true);
      const response = await axios.post('/api/getDiscount', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // console.log("responseeee getDiscount", response);

      if (response.data.status === 201) {
        setLoading(false);
        setShowToast({
          active: true,
          message: response.data.message,
          error: "",
          type: "default"
        });
        setTitle("");
        setSelectBuyProduct(null);
        setSelectGetProduct(null);
        setDiscountPercent(0);
        setSelectOffer("Percent");
        setSelectedDates(selectedDates.end === null);

        setShowBanner(true)
        return;
      }
      else if (response.data.status === 205) {
        setShowToast({
          active: true,
          message: response.data.message,
          error: "",
          type: "error"
        });
        setLoading(false);
        return;
      }
      else if (response.data.status === 404) {
        setShowToast({
          active: true,
          message: "Error in API",
          type: "error",
          error: "",
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      setLoading(false)
      setShowToast({
        active: true,
        message: "Error saving offer",
        error: error.message || "Unknown error",
      });
      console.error('error ===', error);
    }
  };

  // =============================== UPDATE OFFER =============================== //
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      const { key } = location.state
      // console.log('key =====', key);

      let startDate = new Date(key.OfferStartDate);
      let showStartDate = `${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })} `
      setShowOfferDatesAndTime(prevState => ({
        ...prevState,
        offerStartDate: {
          ...prevState.offerStartDate,
          date: showStartDate
        }
      }));
      // ======================= set update value to state =======================//
      setCheckActive(key.isActive)
      setTitle(key.OfferTitle);
      setSelectBuyProduct({
        productID: key.buyProduct.productID, productTitle: key.buyProduct.productTitle, variantId: key.buyProduct.productVarientId, price: key.buyProduct.productPrice
      });
      setSelectGetProduct({
        productID: key.getProduct.productId, productTitle: key.getProduct.productTitle, variantId: key.getProduct.productVarientId, price: key.getProduct.productPrice
      });
      setDiscountPercent(key.DiscountInPercent);
      setSelectOffer(key.offerType);

      if (key.OfferEndDate !== null) {
        let endDatee = new Date(key.OfferEndDate.split("T")[0]);

        let showEndDate = `${endDatee.getDate()} ${endDatee.toLocaleString('default', { month: "short" })}`
        setShowOfferDatesAndTime(prevState => ({
          ...prevState,
          offerEndDate: {
            ...prevState.offerEndDate,
            date: showEndDate
          }
        }));

        const indianTime = new Date(key.OfferEndDate);
        const options = { timeZone: "Asia/Kolkata", hour12: true, hour: "numeric", minute: "numeric" };
        const showOfferEndTime = indianTime.toLocaleString("en-US", options);
        // console.log("showOfferEndTime ===", showOfferEndTime);

        setShowOfferDatesAndTime(prevState => ({
          ...prevState,
          offerEndTime: {
            ...prevState.offerEndTime,
            time: showOfferEndTime
          }
        }));

        setSelectedDates({ ...selectedDates, end: new Date(new Date(key.OfferEndDate).setDate(new Date(key.OfferEndDate).getDate() - 1)) })
      }
    }
  }, []);

  async function updateOffer() {

    if (title.length < 4) {
      setShowToast({
        active: true,
        message: "Title should be greater then 4 letters",
        type: "error",
        error: "",
      });
      return;
    } else if (selectBuyProduct === null || selectGetProduct === null) {
      setShowToast({
        active: true,
        message: "Please select the products",
        type: "error",
        error: "",
      });
      return;
    } else if (selectOffer === "Percent" && Number(discountPercent) <= 0 || Number(discountPercent) > 100) {
      setShowToast({
        active: true,
        message: "Discount Should be greater than 0 and less than 100",
        type: "error",
        error: "",
      });
      return;
    } else if (selectOffer === "Amount" && Number(discountPercent) > Number(selectGetProduct.price)) {
      setShowToast({
        active: true,
        message: "Product price is less than discount amount ",
        type: "error",
        error: "",
      });
      return;
    }

    const formData = {
      BuyProduct: selectBuyProduct,
      GetProduct: selectGetProduct,
      discountPercent: discountPercent,
      offerTitle: title.toUpperCase(),
      endDate: selectedDates.end ? new Date(selectedDates.end) : null,
      offerId: location?.state?.key?.OfferId,
      selectOffer: selectOffer
    };

    try {
      setLoading(true);
      const updateData = await fetch("/api/updateShopify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      // console.log("updateData ===", updateData);
      const response = await updateData.json();
      // console.log("response ===", response);

      if (response.status === 201) {
        setLoading(false);
        setShowToast({
          active: true,
          message: "Offer Update successfully",
          error: "",
          type: "default"
        });
        setTimeout(() => {
          navigate("/app")
        }, 2000);
        return;
      } else if (response.status === 205) {
        setLoading(false)
        setShowToast({
          active: true,
          message: response.message,
          error: "",
          type: "error"
        });
        return;
      } else if (response.status === 404) {
        setShowToast({
          active: true,
          message: " Offer update unsuccessful, Something went wrong",
          error: "",
          type: "error"
        });
      }
      setLoading(false);
    } catch (error) {
      setLoading(false)
      console.log("error in updateOffer", error.message);
    }
  }

  return (
    <Page>
      <Frame>
        <Text variant="bodyLg" as="p"> If you want to see discount list, Go to  <NavLink to="/app"> See Discounts</NavLink> </Text>

        {loading ? (
          <div class="loader-container">
            <div class="loader"></div>
          </div>)
          :
          <>
            <div className='showBanner'>
              {showBanner && <Banner
                title=" Discount Created Successfully"
                tone="success"
                onDismiss={() => { setShowBanner(false) }}
              />}
            </div>

            <FormLayout>
              <div className='homeSection'>

                <div className='leftSection'>
                  <Card sectioned>
                    <div className='upperSection' >
                      <div className='heading'>
                        <Text variant="headingMd" as="h6"> Buy X Get Y </Text>
                        <Text variant="bodyLg" as='p'> Product Discount </Text>
                      </div>
                      <div className='titleField'>
                        <TextField
                          label="Title"
                          value={title}
                          onChange={(e) => setTitle(e)}
                          helpText="Customers will see this in their cart and at checkout."
                        />
                      </div>
                    </div>
                  </Card>

                  <Card sectioned>
                    <div className='middleSection'>
                      <Text variant="headingLg" alignment="justify" fontWeight="semibold" as='h5'> Product Details </Text>
                      <div className='productDetails'>

                        <div className='selectProductDiv' style={{ marginTop: "20px" }}>
                          <h2>Customer Buy</h2>

                          <div className='selectProdcut'>
                            <div className='selectProduct_textfield'>
                              <TextField
                                prefix={<Icon source={SearchIcon} tone='base' />}
                                value={selectBuyProduct?.productTitle}
                                // onChange={(e) => setSelectBuyProduct(e)}
                                placeholder='search Products'
                                autoComplete="off"
                                helpText="Choose the product using the browse button"
                              />
                            </div>
                            <button className='selectProduct_button' onClick={selectProducts} name='buyProduct'>Browse</button>
                          </div>
                        </div>

                        <div className='selectProductDiv'>
                          <h2> Customer Get</h2>
                          <div className='selectProdcut'>
                            <div className='selectProduct_textfield'>
                              <TextField
                                prefix={<Icon source={SearchIcon} tone='base' />}
                                value={selectGetProduct?.productTitle}
                                // onChange={() => selectGetProduct ? setSelectGetProduct(selectGetProduct?.productTitle) : ""}
                                placeholder='search Products'
                                autoComplete="off"
                                helpText="Choose the product using the browse button"
                              />
                            </div>
                            <button className='selectProduct_button' onClick={selectProducts} name='getProduct'>Browse</button>
                          </div>
                        </div>

                        <div className='selectOffer'>
                          <Select
                            options={["Percent", "Amount"]}
                            value={selectOffer}
                            onChange={(e) => setSelectOffer(e)}
                            label="Select Offer Type"
                            helpText="Select Your Discount Type"
                          />
                        </div>

                        <div className='discountTypeAndValue'>
                          <h1> At a discounted value </h1>
                          <div>
                            <TextField
                              prefix={selectOffer === "Amount" ? <Icon source={CashRupeeIcon} tone='base' /> : <Icon source={DiscountIcon} tone='base' />}
                              placeholder=''
                              value={discountPercent}
                              onChange={(e) => setDiscountPercent(e)}
                              style={{ width: '70px', marginLeft: '10px' }}
                              helpText="Enter your discount price in amount or in percent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card sectioned>
                    <div className='lowerSection'>
                      <h2 style={{ color: 'black', fontWeight: "bold", fontSize: "medium", marginBottom: "10px" }}>Discount End Date</h2>
                      <div className='calender' style={{ padding: "20px" }} >
                        <DatePicker
                          month={month}
                          year={year}
                          onChange={handleDateChange}
                          onMonthChange={handleMonthChange}
                          selected={selectedDates?.end}
                          disableDatesBefore={new Date(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()))}
                          allowRange={true}
                          multiMonth={false}
                        />
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div className='rigthSection'>
                  <Card>
                    <div className='rightAbove'>
                      <div className='summery'>
                        <h1>Summery</h1>
                        {title ? (<p style={{ marginTop: "10px", fontWeight: "bold" }}>{title.toUpperCase()} </p>) : (<p style={{ marginTop: "10px" }}> No title yet</p>)}
                      </div>

                      <div className='typeandmethod'>
                        <h1> Types and Method </h1>
                        <List>
                          <List.Item>Buy X get Y</List.Item>
                          <List.Item>Automatic</List.Item>
                        </List>
                      </div>

                      <div className='Details'>
                        <h1>Details</h1>
                        {location.state ?
                          <div>
                            <List type='bullet'>
                              <List.Item> For Online Store </List.Item>
                              <List.Item> Buy 1 item, <br /> Get 1 item at {discountPercent} {selectOffer === "Percent" ? "% off" : "Rs Off"}  ,<br /> 1 use per order </List.Item>
                              {location?.state?.key?.OfferEndDate === null ? <List.Item> Active from {showOfferDatesAndTime.offerStartDate.date} </List.Item> : <List.Item> Active from {showOfferDatesAndTime.offerStartDate.date} to {showOfferDatesAndTime.offerEndDate.date} </List.Item>}
                              {location?.state?.key?.OfferEndDate === null ? "" : <List.Item> Ends On {showOfferDatesAndTime.offerEndDate.date} At {showOfferDatesAndTime.offerEndTime.time} </List.Item>}
                            </List>
                          </div> : <List><List.Item> Can’t combine with other discounts </List.Item></List>}
                      </div>

                      <div className='performance'>
                        <h1> Performance </h1>
                        {location.state ? (checkActive === "Active" ? <Badge tone="success">Active</Badge> : <Badge tone="critical"> Expired </Badge>) : (<Text as='p' tone="subdued">Discount is not active yet</Text>)}
                      </div>
                    </div>
                  </Card>

                  <div className='rightDown'>
                    <div className='submitButton'>
                      {location.state != null ? (
                        <Button size='large' variant="primary" onClick={updateOffer} loading={loading}>Update Offer</Button>
                      ) : (
                        <Button size='large' variant="primary" onClick={createOffer} loading={loading} >Create Offer</Button>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {
                showToast.active &&
                <Toast content={showToast.message} duration={4500} error={showToast.type !== "default"} onDismiss={() => setShowToast({ active: false, message: "", error: "" })} />
              }
            </FormLayout>
          </>
        }
      </Frame>
    </Page>
  );
};

export default DiscountForm;
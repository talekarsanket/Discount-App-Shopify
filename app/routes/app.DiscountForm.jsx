import React, { useState, useCallback, useEffect } from 'react';
import { SearchIcon, CashRupeeIcon, DiscountFilledIcon, DiscountIcon } from '@shopify/polaris-icons';
import { Page, LegacyCard, DatePicker, Button, Toast, Frame, FormLayout, TextField, Select, Card, Icon } from '@shopify/polaris';
import axios from 'axios';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const DiscountForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState({ active: false, message: "", error: "", type: "default" });
  const [selectBuyProduct, setSelecBuytProduct] = useState(null);
  const [selectGetProduct, setSelectGetProduct] = useState(null);
  const [discountPercent, setDiscountPercent] = useState();
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

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [{ month, year }, setDate] = useState({ month: currentMonth, year: currentYear });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(currentDate),
    end: null,
  });

  const handleDateChange = (date) => {
    setSelectedDates({ ...date });
  };

  const handleMonthChange = useCallback(
    (month, year) => setDate({ month, year }),
    []
  );

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
      setSelecBuytProduct({
        ...selectBuyProduct, productID: id, productTitle: productTitle, variantId, price
      });
    } else if (e.target.name === "getProduct") {
      setSelectGetProduct({
        ...selectGetProduct, productID: id, productTitle: productTitle, variantId, price
      });
    }
  }

  // -------------------CREATE OFFER------------------//
  const getData = async () => {
    setLoading(true);
    if (title.length < 4) {
      setShowToast({
        active: true,
        message: "Title should be greater then 4 letters",
        error: "",
        type: "error"
      });
      setLoading(false);
      return;
    } else if (selectBuyProduct === null || selectGetProduct === null) {
      setShowToast({
        active: true,
        message: "Please select the products",
        error: "",
        type: "error"
      });
      setLoading(false)
      return;
    } else if (selectOffer === "Percent" && Number(discountPercent) <= 0 || Number(discountPercent) > 100) {
      setShowToast({
        active: true,
        message: "Discount Should greater than 0 and less than 100",
        error: "",
        type: "error"
      });
      setLoading(false)
      return;
    } else if (selectOffer === "Amount" && Number(discountPercent) > Number(selectGetProduct.price)) {
      setShowToast({
        active: true,
        message: "Product price is less than offer amount",
        error: "",
        type: "error"
      });
      setLoading(false)
      return;
    } else if (discountPercent === undefined) {
      setShowToast({
        active: true,
        message: "Discount value can't be blank",
        error: "",
        type: "error"
      });
      setLoading(false);
      return
    };

    const formData = {
      BuyProduct: selectBuyProduct,
      GetProduct: selectGetProduct,
      discountPercent: discountPercent,
      offerTitle: title,
      endDate: selectedDates.end ? selectedDates.end : null,
      selectOffer: selectOffer
    };
    // console.log("formData ==========", formData);

    try {
      const response = await axios.post('/api/getDiscount', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log("responseeee getDiscount", response);

      if (response.data.status === 201) {
        setShowToast({
          active: true,
          message: response.data.message,
          error: "",
          type: "default"
        });
        setTitle("");
        setDiscountPercent("");
        setSelectGetProduct(null);
        setSelecBuytProduct(null)
        setSelectOffer("");
        setSelectedDates(null);

        setTimeout(() => {
          navigate("/app")
        }, 2000)
      }
      else if (response.data.status === 205) {
        setShowToast({
          active: true,
          message: response.data.message,
          error: "",
          type: "error"
        });
      }
      else if (response.data.status === 404) {
        setShowToast({
          active: true,
          message: "Error in API",
          type: "error",
          error: "",
        });
      }
      setLoading(false);
      return;
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



  // ---------------- UPDATE OFFER ------------------//
  const location = useLocation();
  // console.log('location', location.state);
  useEffect(() => {
    if (location.state) {
      const { key } = location.state

      if (key.OfferEndDate !== null) {
        let endDatee = new Date(key.OfferEndDate.split("T")[0])
        let showEndDate = `${endDatee.getDate()} ${endDatee.toLocaleString('default', { month: "short" })} ${endDatee.toLocaleString('default', { year: "numeric" })}`
        setShowOfferDatesAndTime(prevState => ({
          ...prevState,
          offerEndDate: {
            ...prevState.offerEndDate,
            date: showEndDate
          }
        }))
        const indianTime = new Date(key.OfferEndDate);
        const options = { timeZone: "Asia/Kolkata", hour12: true, hour: "numeric", minute: "numeric" };
        const showOfferEndTime = indianTime.toLocaleString("en-US", options);
        console.log("showOfferEndTime ===", showOfferEndTime);

        setShowOfferDatesAndTime(prevState => ({
          ...prevState,
          offerEndTime: {
            ...prevState.offerEndTime,
            time: showOfferEndTime
          }
        }))
      }
      let startDate = new Date(key.OfferStartDate);
      let showStartDate = `${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })} ${startDate.toLocaleString('default', { year: "numeric" })}`
      console.log("showStartDate ==", showStartDate);

      setShowOfferDatesAndTime(prevState => ({
        ...prevState,
        offerStartDate: {
          ...prevState.offerStartDate,
          date: showStartDate
        }
      }));
      console.log("showOfferDatesAndTime====", showOfferDatesAndTime);

      setCheckActive(key.isActive)
      setTitle(key.OfferTitle);
      setSelecBuytProduct({
        productID: key.buyProduct.productID, productTitle: key.buyProduct.productTitle, variantId: key.buyProduct.productVarientId, price: key.buyProduct.productPrice
      });
      setSelectGetProduct({
        productID: key.getProduct.productId, productTitle: key.getProduct.productTitle, variantId: key.getProduct.productVarientId, price: key.getProduct.productPrice
      });
      setDiscountPercent(key.DiscountInPercent);

      if (key.OfferEndDate !== null) {
        setSelectedDates({ ...selectedDates, end: new Date(key.OfferEndDate.split("T")[0]) })
      }
      setSelectOffer(key.offerType);
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
      setLoading(false)
      return;
    } else if (selectBuyProduct === null || selectGetProduct === null) {
      setShowToast({
        active: true,
        message: "Please select the products",
        type: "error",
        error: "",
      });
      setLoading(false)
      return;
    } else if (selectOffer === "Percent" && Number(discountPercent) === "" || Number(discountPercent) <= 0 || Number(discountPercent) > 100) {
      setShowToast({
        active: true,
        message: "Discount Should be greater than 0 and less than 100",
        type: "error",
        error: "",
      });
      setLoading(false)
      return;
    } else if (selectOffer === "Amount" && Number(discountPercent) > Number(selectGetProduct.price)) {
      setShowToast({
        active: true,
        message: "Product price is less than discount amount ",
        type: "error",
        error: "",
      });
      setLoading(false)
      return;
    } else if (discountPercent === undefined) {
      setShowToast({
        active: true,
        message: "Discount value can't be blank",
        error: "",
        type: "error"
      });
      setShowError("Discount value can't be blank")
      setLoading(false)
    };

    const formData = {
      BuyProduct: selectBuyProduct,
      GetProduct: selectGetProduct,
      discountPercent: discountPercent,
      offerTitle: title.toUpperCase(),
      endDate: selectedDates.end,
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
      console.log("response ===", response);

      if (response.status === 201) {
        setShowToast({
          active: true,
          message: "Offer Update successfully",
          error: "",
          type: "default"
        });
        setTimeout(() => {
          navigate("/app")
        }, 1000)
      }
      else if (response.status === 205) {
        setShowToast({
          active: true,
          message: "Your expiry date is less than today's date",
          error: "",
          type: "error"
        });
      }
      setLoading(false);
    } catch (error) {
      setLoading(false)
      console.log("error in updateOffer", error);
    }
  }

  return (
    <Page>
      <Frame>
        <div>
          <p> If you want to see discount list, Go to  <NavLink to="/app"> See Discounts</NavLink></p>
        </div>
        <FormLayout>
          <div className='homeSection' style={{ display: "flex", gap: "20px" }}>
            <div className='leftSection' style={{ width: "80%", display: "flex", flexDirection: "column", gap: "20px" }}>

              <Card sectioned>
                <div className='upperSection'  >
                  <div className='heading' style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <h1 style={{ color: 'black', fontWeight: "bold", fontSize: "medium", marginBottom: "10px" }}> Buy X Get Y </h1>
                    <p> Product Discount </p>
                  </div>
                  <div className='title' style={{ fontSize: "medium", width: "70%", marginLeft: '30px' }} >
                    <TextField
                      label="Title"
                      value={title.toUpperCase()}
                      onChange={(e) => setTitle(e)}
                      helpText="Customers will see this in their cart and at checkout."
                    />
                  </div>
                </div>
              </Card>

              <Card sectioned>
                <div className='middleSection'>
                  <h2 style={{ color: 'black', fontWeight: "bold", fontSize: "medium", marginBottom: "20px" }}> Product Details </h2>
                  <div className='productDetails' style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className='buyProduct' style={{ width: "70%", marginLeft: '30px' }}>
                      <h2 style={{ fontSize: "medium", marginBottom: "8px" }}>Customer buys</h2>
                      <div style={{ display: "flex", gap: '8px', }}>
                        <div style={{ width: "100%", }}>
                          <TextField
                            prefix={<Icon source={SearchIcon} tone='base' />}
                            value={selectBuyProduct?.productTitle}
                            onChange={(e) => setSelecBuytProduct(e)}
                            placeholder='search Products'
                            autoComplete="off"
                          />
                        </div>
                        <button style={{
                          borderRadius: "5px", maxHeight: "30px", boxShadow: " rgb(0 0 0 / 58%) 0px 2px 5px -1px, rgb(166 156 156 / 30%) 0px 1px 3px -1px", padding: "5px", cursor: "pointer", backgroundColor: "white", border: "0px"
                        }}
                          onClick={selectProducts} name='buyProduct'>Browse</button>
                      </div>
                      <p>Choose the product using the browse button</p>
                    </div>
                    <div className='getProduct' style={{ width: "70%", marginLeft: '30px' }}>
                      <h2 style={{ fontSize: "medium", marginBottom: "8px" }}>Get Product</h2>
                      <div style={{ display: "flex", gap: '8px' }} >
                        <div style={{ width: "100%", }}>
                          <TextField
                            prefix={<Icon source={SearchIcon} tone='base' />}
                            value={selectGetProduct?.productTitle}
                            onChange={() => selectGetProduct ? setSelectGetProduct(selectGetProduct?.productTitle) : ""}
                            placeholder='search Products'
                            autoComplete="off"
                          />
                        </div>
                        <button style={{
                          borderRadius: "5px", maxHeight: "30px", boxShadow: " rgb(0 0 0 / 58%) 0px 2px 5px -1px, rgb(166 156 156 / 30%) 0px 1px 3px -1px", padding: "5px", cursor: "pointer", backgroundColor: "white", border: "0px"
                        }}
                          onClick={selectProducts} name='getProduct'>Browse</button>
                      </div>
                      <p>Choose the product using the browse button</p>
                    </div>

                    <div className='discountType' style={{ width: "63%", marginLeft: '30px', fontSize: "medium" }}>
                      <Select
                        options={["Percent", "Amount"]}
                        value={selectOffer}
                        onChange={(e) => setSelectOffer(e)}
                        label="Select Offer Type"
                      />
                    </div>

                    <div style={{ width: "63%", marginLeft: '30px', fontSize: "medium" }}>
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
                <div className='lowerSection' style={{ padding: "rightSection10px", display: "block", width: "93%%", margin: "auto" }}>
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

            <div className='rigthSection' style={{ width: "30%", display: "flex", flexDirection: "column", justifyContent: "space-between", flexWrap: "wrap" }}>
              <Card>
                <div className='rightAbove' style={{ width: "100%" }}>
                  <div className='summery' style={{ marginBottom: "20px" }}>
                    <h1 style={{ fontSize: "medium", fontWeight: "bold" }}>Summery</h1>
                    {title ? (<p style={{ marginTop: "10px", fontWeight: "bold" }}>{title.toUpperCase()} </p>) : (<p style={{ marginTop: "10px" }}> No title yet</p>)}
                  </div>
                  <div className='typeandmethod' style={{ marginBottom: "20px" }}>
                    <h1 style={{ fontSize: "medium", fontWeight: "bold" }}> Types and Method </h1>
                    <ul>
                      <li> Buy X get Y </li>
                      <li>Automatic</li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h1 style={{ fontSize: "medium", fontWeight: "bold", marginBottom: "10px" }}>Details</h1>
                    {location.state ? <h1>Offer Starts from <span style={{ fontWeight: "bold" }}>{showOfferDatesAndTime.offerStartDate.date}</span></h1> : ""}
                    {location.state?.key.OfferEndDate === null ? <h1>Offer Ends On : null </h1> : <h1>Offer Ends On <span style={{ fontWeight: "bold" }}>{showOfferDatesAndTime.offerEndDate.date}</span>, At <span style={{ fontWeight: "bold" }}>{showOfferDatesAndTime.offerEndTime.time}</span> </h1>}

                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <h1 style={{ fontSize: "medium", fontWeight: "bold", marginBottom: "10px" }}>Performance</h1>
                    {location.state ? (checkActive === "Active" ? (<h3 style={{ color: "green" }}>Active</h3>) : (<h3 style={{ color: "red" }}>Expired</h3>)) : (<p>Discount is not active yet</p>)}
                  </div>
                </div>
              </Card>

              <div className='rightDown' style={{ width: "100%", padding: "30px" }}>
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  {location.state != null ? (
                    <Button size='large' variant="primary" onClick={updateOffer} loading={loading}>Update Offer</Button>
                  ) : (
                    <Button size='large' variant="primary" onClick={getData} loading={loading} >Create Offer</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {showToast.active &&
            <Toast content={showToast.message} duration={4500} error={showToast.type !== "default"} onDismiss={() => setShowToast({ active: false, message: "", error: "" })} />
          }
        </FormLayout>
      </Frame>
    </Page>
  );
};

export default DiscountForm;
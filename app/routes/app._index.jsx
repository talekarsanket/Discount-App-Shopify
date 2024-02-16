import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IndexTable,
  Text,
  Page,
  Button,
  ButtonGroup,
  Icon,
  Toast,
  Frame,
  useBreakpoints,
  Modal,
  TextContainer,
} from "@shopify/polaris";
import {
  DeleteIcon,
  EditIcon,
  PlusIcon,
  ViewIcon,
  HideIcon,
} from "@shopify/polaris-icons";
import axios from "axios";
import { useDispatch } from "react-redux";
import { enterShopData } from "../redux/shopInforeducer";
import BannerExtension from "../component/BannerExtension";

export default function Index() {
  const [loading, setLoading] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [deleteOfferName, setDeleteOfferName] = useState("");
  const [action, setAction] = useState("")
  const [offerId, setOfferId] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [showToast, setShowToast] = useState({ active: false, message: "", error: "", type: "default" });
  const [appEmbededBlockDisabled, setAppEmbededBlockDisabled] = useState(false);

  const reduxDispatch = useDispatch();
  const navigate = useNavigate();

  const resourceName = {
    singular: 'offer',
    plural: 'offers',
  };

  //------------ CHECK EXTENSION IS ENABLE OR NOT ----------------//
  const checkApiCall = async () => {
    setLoading(true);
    try {
      const response = await fetch("api/checkAppEmbededBlock", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const jsonData = await response.json()
      console.log("checkAppEmbededBlock_response =====", jsonData);
      setAppEmbededBlockDisabled(jsonData.appEmbededBlockDisabled);
      reduxDispatch(enterShopData(jsonData.shopData));
      setLoading(false);
    } catch (error) {
      console.error("Error checking route:", error);
      setLoading(false);
    }
  };

  // ------------- DISPLAY ALL OFFER -------------//
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("api/active_cart", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      // console.log("response active_cart =========", response);
      setTableData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };
  // console.log("tableData", tableData);

  const rowMarkup = tableData?.map(({ _id, OfferTitle, DiscountInPercent, OfferId, offerType, isActive, buyProduct, getProduct, OfferEndDate },
    index,
  ) => (
    <IndexTable.Row
      id={_id}
      key={_id}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="headingMd" alignment="justify" fontWeight="bold" as="span">
          {OfferTitle
          }
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <Text variant="bodyMd" alignment="justify" >Buy product: {buyProduct.productTitle}</Text>
          <Text variant="bodySm" alignment="justify" >Get product: {getProduct.productTitle}</Text>
          {
            offerType === "Amount" ? (<Text variant="bodySm" alignment="justify" > At {DiscountInPercent} Rs off </Text>) : <Text variant="bodySm" alignment="justify" >At {DiscountInPercent}% Off</Text>
          }
        </div>
      </IndexTable.Cell>

      <IndexTable.Cell>
        {OfferEndDate === null ? <Text> EndLess </Text> :
          (<Text> {`${OfferEndDate.split("T")[0]}`}  </Text>)
        }
      </IndexTable.Cell>
      <IndexTable.Cell>
        {isActive === "Active" ? <h2 style={{ color: "green" }}> Active </h2> : <h2 style={{ color: "red" }}>Expired</h2>}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <ButtonGroup gap="tight" >  
          {isActive === "Active" ?
            (<Button disabled={loading} tone="inherit" onClick={() => handleActions("deactivate", OfferId, OfferTitle)}>
              <Icon
                source={ViewIcon}
              />
            </Button>) :
            (<Button disabled={loading} tone="success" onClick={() => activateDsicount(OfferId)}>
              <Icon
                source={HideIcon}
              />
            </Button>)
          }
          <Button loading={loading} onClick={() => editRouteHandle(OfferId)}>
            <Icon
              source={EditIcon}
              tone="base"
            />
          </Button>
          <Button variant="primary" tone="critical" loading={loading} onClick={() => handleActions("delete", OfferId, OfferTitle)}  >
            <Icon
              source={DeleteIcon}
              tone="base"
            />
          </Button>
        </ButtonGroup>

      </IndexTable.Cell>
    </IndexTable.Row >
  ),
  );

  async function handleActions(actionType, offerId, offerTitle) {
    setDeleteOfferName(offerTitle)
    setAction(actionType);
    setOfferId(offerId);
    setModelOpen(true)
  }

  const handleModalClose = () => {
    setModelOpen(false);
    setAction("");
    setOfferId(null);
  };

  // ================== delete and deactivate route handling =====================//
  async function handleConfirmAction() {
    // =========== Delete Route Handle ==============//
    if (action === "delete") {
      try {
        setLoading(true);
        const response = await fetch("/api/deleteDiscount", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(offerId)
        });
        const result = await response.json()
        // console.log("result=======", result);
        setLoading(false);
        if (result.status === 201) {
          setModelOpen(false);
          setOfferId(null);
          setShowToast({
            active: true,
            message: result.message,
            error: "",
            type: "default"
          });
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        setLoading(false);
        console.log("error in deleteRouteHandle ===", error);
      }
    } else if (action === "deactivate") {
      // =========== Deactivate Route Handle ==============//
      try {
        setLoading(true);
        const deactiveDisountAPI = await fetch("api/deactiveDiscount", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(offerId)
        });

        if (deactiveDisountAPI.status === 200) {
          const jsonResponse = await deactiveDisountAPI.json();
          // console.log("jsonResponse ====", jsonResponse);

          if (jsonResponse.status === 200) {
            setShowToast({
              active: true,
              message: jsonResponse.message,
              error: "",
              type: "default"
            });
            setTimeout(() => {
              window.location.reload()
            }, 1000);
            setLoading(false);
          } else if (jsonResponse.status === 201) {
            setShowToast({
              active: true,
              message: jsonResponse.message,
              error: "",
              type: "error"
            });
            setLoading(false)
          } else {
            // Handle unexpected status codes
            setShowToast({
              active: true,
              message: "Unexpected response from server",
              error: "",
              type: "error"
            });
            setLoading(false);
          }
        } else {
          setShowToast({
            active: true,
            message: "Failed to deactivate offer. Please try again.",
            error: "",
            type: "error"
          });
          setLoading(false);
        }
      } catch (error) {
        setLoading(false)
        console.log("error in deactivate api ===", error);
        setShowToast({
          active: true,
          message: "An error occurred. Please try again later.",
          error: "",
          type: "error"
        });
      }
    }
  }

  // ============= activate route ==================//
  async function activateDsicount(id) {
    try {
      const activateDiscountApi = await fetch("api/activateDiscount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(id)
      });
      // console.log("activateDiscountApi =======", activateDiscountApi);

      if (activateDiscountApi.status === 200) {
        const resposeJson = await activateDiscountApi.json();
        console.log("resposeJson =======", resposeJson);

        if (resposeJson.status === 200) {
          setShowToast({
            active: true,
            message: resposeJson.message,
            error: "",
            type: "default"
          });
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          setLoading(false);
        } else if (resposeJson.status === 201) {
          setShowToast({
            active: true,
            message: resposeJson.message,
            error: "",
            type: "default"
          });
          setLoading(false);
        }
      } else {
        setShowToast({
          active: true,
          message: "Failed to activeApi offer. Please try again.",
          error: "",
          type: "default"
        });
        setLoading(false);
      }
    } catch (error) {
      setLoading(false)
      console.log("error in activeApi api ===", error);
      setShowToast({
        active: true,
        message: "An error occurred. Please try again later.",
        error: "",
        type: "error"
      });
    }
  }

  // ============= Edit Route ==================// 
  async function editRouteHandle(id) {
    setLoading(true)
    try {
      const fetchEditApi = await fetch("api/editOffer", {
        body: JSON.stringify(id),
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      // console.log("fetchEditApi ==", fetchEditApi);
      const response = await fetchEditApi.json();
      console.log("response ===", response);
      navigate("/app/DiscountForm", { state: { key: response.data } });
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log("error in editRouteHandle ==", error);
    }
  }

  useEffect(() => {
    checkApiCall();
    fetchData();
  }, []);

  return (
    <Page>
      <Frame>
        <>
          {appEmbededBlockDisabled ? (
            <BannerExtension />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", }}>
                <h1 style={{ fontSize: "large", fontWeight: "bold" }}> Discounts </h1>
                <Button icon={PlusIcon} variant="primary" loading={loading} onClick={() => navigate("/app/DiscountForm")}> Create New Offer </Button>
              </div>

              <IndexTable
                condensed={useBreakpoints().smDown}
                resourceName={resourceName}
                itemCount={tableData.length}

                headings={[
                  { title: 'Title' },
                  { title: 'Type' },
                  { title: 'End Date' },
                  { title: "Status" },
                  { title: 'Action' },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>

              {showToast.active && (
                <>
                  {showToast.type === "default" ? (
                    <Toast content={showToast.message} duration={2000} onDismiss={() => setShowToast({ active: false, message: "", error: "" })} />
                  ) : (
                    <Toast content={showToast.message} duration={2000} error onDismiss={() => setShowToast({ active: false, message: "", error: "" })} />
                  )}
                </>
              )}

              <Modal
                open={modelOpen}
                onClose={handleModalClose}
                title={action === "delete" ? deleteOfferName : deleteOfferName}
                primaryAction={{
                  content: action === "delete" ? "Delete" : "Deactivate  ",
                  onAction: () => handleConfirmAction()
                }}
                secondaryActions={[
                  {
                    content: "Cancel",
                    onAction: () => {
                      setModelOpen(false);
                      setOfferId("")
                    }
                  }
                ]}
              >
                <Modal.Section>
                  <TextContainer>
                    {action === "delete" ?
                      (<p>
                        Are you sure you want to delete {deleteOfferName} discount? This action cannot be undone.
                      </p>) :
                      (<p>
                        This discount will expire now and all unsaved changes will be lost.
                      </p>)
                    }
                  </TextContainer>
                </Modal.Section>

              </Modal>
            </>
          )}
        </>
      </Frame>
    </Page >
  );
}
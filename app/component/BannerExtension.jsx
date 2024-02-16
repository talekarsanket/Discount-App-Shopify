import { Banner, List } from '@shopify/polaris';
import React from 'react';
import { useSelector } from 'react-redux';

const BannerExtension = () => {
    const shopData = useSelector((state) => state.shopData);
    console.log("shopData ===", shopData?.shopData?.domain);

    const handleAction = () => {
        window.open(`https://${shopData?.shopData?.domain}/admin/themes/current/editor?context=apps&template=${'product'}&activateAppId=ca91e4cc-1d89-46d5-8555-52896875f2c5/discountBxGy`, '_blank');
    };

    return (
        <Banner
            title="Enable Theme App Extension"
            action={{ content: 'Add Theme App Extension', onAction: handleAction }}
            status="warning"
        >
            <List>
                <List.Item>
                    Please enable the theme app extension by clicking the button <b>Add Theme App Extension</b> otherwise your app is not going to be functional.<br></br>
                    After clicking the button, you will be redirected to the theme editor page. Then in the right corner click on <b>Save</b> button.
                </List.Item>
            </List>
        </Banner>
    );
};

export default BannerExtension;
//This code valdiates if a google play or ios app store  subscription is still valid and saves it in a NOSql database

const AWS = require("aws-sdk");
AWS.config.update({ region: "eu-west-2" });
const axios = require("axios");
var documentClient = new AWS.DynamoDB.DocumentClient();
let ValidateSubscription = async (event) => {
  let profileData;
  try {
    profileData = await getUserData(event.user_id);
  } catch (error) {
    return false;
  }

  if (!profileData) {
    return false;
  }
  let now = Math.round(+new Date() / 1000);
  if (now < profileData.sub_data.expiryTime) {
    console.log("it hasnt been 30 days yet");
    return { premium: true, expiryTime: profileData.sub_data.expiryTime };
  }
  console.log("have to check for token");

  if (profileData.sub_data.purchaseToken) {
    console.log("entering Android");
    let purchaseToken = profileData.sub_data.purchaseToken;
    let expiry: number = 0;
    let token = await getAndValidateToken();

    if (!token) {
      console.log("no accsses token ,generating a new one");
      token = await saveAndGetToken();
    } else {
      console.log("token was valid");
    }

    let status;
    try {
      console.log("checking reciept");
      status = await getRecieptStatus(
        token.access_token,
        purchaseToken,
        event.user_id
      );
    } catch (error) {
      console.log(error);
      return false;
    }
    console.log("user was valid:", status);
    if (status === false) {
      try {
        console.log("removing row");
        await removeRow(event.user_id);
        return false;
      } catch (error) {
        return false;
      }
    }
    return status;
  }
  if (profileData.sub_data.transactionReceipt) {
    console.log("entering ios");
    let data = await getIosRecieptData(profileData.sub_data.transactionReceipt);
    if (!data) {
      return false;
    }
    try {
      data = data.latest_receipt_info[data.latest_receipt_info.length - 1];
      data = Math.floor(parseInt(data.expires_date_ms)) / 1000;
      console.log("get reciept expiry", data);
    } catch (error) {
      console.log(error);
      return false;
    }
    let now = Math.round(+new Date() / 1000);
    if (now > data) {
      console.log("removing row ios");
      await removeRow(event.user_id);
      return false;
    } else {
      console.log("changing expiry ios");
      await changeExpiry(event.user_id, data);
      return { premium: true, expiryTime: data };
    }
    return false;
  }
  return false;
};
export const getIosRecieptData = async (reciept: string) => {
  const password: string = "cantdisclose"; // Shared Secret from iTunes connect
  var iap = require("in-app-purchase");
  iap.config({
    applePassword: password, // this comes from iTunes Connect (You need this to valiate subscriptions)
    test: true, // For Apple and Googl Play to force Sandbox validation only
    // verbose: true // Output debug logs to stdout stream
  });
  await iap.setup();
  let data;
  try {
    data = await iap.validate(reciept);
  } catch (error) {
    console.log(error);
    return null;
  }
  return data;
};
export const removeRow = (user_id) => {
  var params = {
    TableName: "SUBS",
    Key: {
      user_id,
    },
  };

  return documentClient.delete(params).promise();
};
export const getRecieptStatus = async (
  accessToken: string,
  purchaseToken: string,
  user_id: string
) => {
  // console.log(accessToken);
  let status = await axios.get(
    `https://www."cantdisclose"/subscriptions//tokens/${purchaseToken}?access_token=${accessToken}`
  );

  status = { ...status.data };
  let expiry = Math.round(parseInt(status.expiryTimeMillis) / 1000);
  if (status.userCancellationTimeMillis) {
    let now = Math.round(+new Date() / 1000);

    if (now > expiry) {
      return false;
    } else {
      try {
        await changeExpiry(user_id, expiry);
      } catch (error) {
        console.log(error);
        return false;
      }
      return { premium: true, expiryTime: expiry };
    }
  } else {
    try {
      await changeExpiry(user_id, expiry);
    } catch (error) {
      console.log(error);
      return false;
    }
    return { premium: true, expiryTime: expiry };
  }
};
export const getUserData = async (user_id: string) => {
  console.log(user_id, "user_id");
  var params = {
    TableName: "SUBS",
    Key: {
      user_id: user_id,
    },
  };

  let data;
  try {
    data = await documentClient.get(params).promise();
  } catch (error) {
    console.log(error, "when getting the user");
    return null;
  }
  if (!data.Item) {
    return null;
  }

  return data.Item;
};
export const getAndValidateToken = async () => {
  var params = {
    TableName: "SUBS",
    Key: {
      user_id: "token",
    },
  };
  let token;
  try {
    token = await documentClient.get(params).promise();
  } catch (error) {
    console.log(error);
    return null;
  }
  token = token.Item;

  if (!token.expires_in) {
    return null;
  }
  let now = Math.round(+new Date() / 1000);
  if (parseInt(token.expires_in) < now) {
    return null;
  } else {
    console.log("tokenValid");
    return token;
  }
};

export const addTokenToTable = (
  token: string,
  expires_in: number
): Promise<any> => {
  let now = Math.round(+new Date() / 1000);
  var params = {
    TableName: "SUBS",
    Key: {
      user_id: "token",
    },
    UpdateExpression: "set access_token = :token , expires_in= :expires_in",
    ExpressionAttributeValues: {
      ":token": token,
      ":expires_in": now + expires_in,
    },
    ReturnValues: "UPDATED_NEW",
  };
  return documentClient.update(params).promise();
};
export const changeExpiry = (
  user_id: string,
  expiryTime: number
): Promise<any> => {
  console.log("changing expiry");
  let now = Math.round(+new Date() / 1000);
  var params = {
    TableName: "SUBS",
    Key: {
      user_id,
    },
    UpdateExpression: "set sub_data.expiryTime = :expires_in",
    ExpressionAttributeValues: {
      ":expires_in": expiryTime,
    },
    ReturnValues: "UPDATED_NEW",
  };
  return documentClient.update(params).promise();
};
export const saveAndGetToken = async () => {
  console.log("getting a new token");
  let authData;
  try {
    authData = await axios.post("cantdisclose");
  } catch (error) {
    console.log(error);
    return null;
  }

  if (!authData.data) {
    return null;
  }

  try {
    await addTokenToTable(authData.data.access_token, authData.data.expires_in);
  } catch (error) {
    console.log(error);
  }
  return authData.data.access_token;
};
export default ValidateSubscription;
// ValidateSubscription({ user_id: "44d76cba-01a9-4ab5-84de-c179258df444" }).then(
//   res => {
//     console.log(res);
//   }
// );

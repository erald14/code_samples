export const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
};

export function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}
export const compareOrder = (a, b) => {
  if (a.order < b.order) {
    return -1;
  }
  if (a.order > b.order) {
    return 1;
  }
  return 0;
};

export const formatCurrency = (value) => {
  return "$" + value.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
};

export const validateSSN = (value) => {
  let ssnPattern = /^[0-9]{3}-?[0-9]{2}-?[0-9]{4}$/;
  return ssnPattern.test(value);
};

export const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const splitString = (originalString) => {
  var attrs = [];

  var RefString = function (s) {
    this.value = s;
  };
  RefString.prototype.toString = function () {
    return this.value;
  };
  RefString.prototype.charAt = String.prototype.charAt;
  var data = new RefString(originalString);

  var getBlock = function (endChr, restString) {
    var block = "";
    var currChr = "";
    while (currChr !== endChr && restString.value !== "") {
      if (/'|"/.test(currChr)) {
        block = block.trim() + getBlock(currChr, restString);
      } else if (/\{/.test(currChr)) {
        block = block.trim() + getBlock("}", restString);
      } else if (/\[/.test(currChr)) {
        block = block.trim() + getBlock("]", restString);
      } else {
        block += currChr;
      }
      currChr = restString.charAt(0);
      restString.value = restString.value.slice(1);
    }
    return block.trim();
  };

  do {
    var attr = getBlock(",", data);
    attrs.push(attr);
  } while (data.value !== "");
  return attrs;
};

export const formatMoney = (
  amount,
  decimalCount = 2,
  decimal = ".",
  thousands = ","
) => {
  try {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? "-" : "";

    let i = parseInt(
      (amount = Math.abs(Number(amount) || 0).toFixed(decimalCount))
    ).toString();
    let j = i.length > 3 ? i.length % 3 : 0;

    return (
      negativeSign +
      (j ? i.substr(0, j) + thousands : "") +
      i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) +
      (decimalCount
        ? decimal +
          Math.abs(amount - i)
            .toFixed(decimalCount)
            .slice(2)
        : "")
    );
  } catch (e) {
    console.log(e);
    return "";
  }
};

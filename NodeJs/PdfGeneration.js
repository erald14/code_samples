const contact = require("../../contacts/DAO/migrations/contact");

module.exports = async (newObj) => {
  var PdfPrinter = require("pdfmake");
  var fs = require("fs");
  var htmlToPdfmake = require("html-to-pdfmake");
  var jsdom = require("jsdom");
  var { JSDOM } = jsdom;
  var { window } = new JSDOM("");
  const moment = require("moment");
  const {
    footer,
    header,
    keyValue,
    delimeter,
    p,
    section,
    option_line,
    multiple,
    checked,
    headlessTable,
    question,
    cashField,
    table,
    moneyString,
    headerSurgical,
    signature,
    tableMcp,
    newSection,
    unbreakable,
    contactInfo,
    multipleContacts,
    injuryInformation,
    unbreakableSection,
    RichTextField,
    getImageAsBuffer,
  } = require("./shared");
  const {
    msaKeyValue,
    info_row,
    msaTable,
    msaTableP,
    injury_claim,
  } = require("./msa_shared");
  const {
    total_anticipated_medicare_cost,
    anticipated_non_medicare_cost,
    anticipated_medicare_cost,
    first_surgery_cost,
    seedMoney,
    annuity_payment_over_life,
    lengthOfAnnuity,
    annuity_amount,
    total_annual_medicare_costs_,
    claculate_inflation,
    claculate_inflation_forMultiple,
    section_total,
  } = require("./logic");

  const reportAll = newObj;

  let { report, medicare, tenant } = reportAll;

  report.settings = {
    inflation: report.has_inflation,
    interest_rate: report.interest_rate,
  };
  const {
    claimant,
    plaintiff_attorney_alias,
    insurance_carrier_alias,
    juridiction_state,
    employer_demographics_alias,
    defense_attorney_alias,
    treating_providers_alias,
  } = report;
  let client_logo;
  if (report.claimant.client.client_logo) {
    client_logo = await getImageAsBuffer(report.claimant.client.client_logo);
  }
  report.show_additional_comments = false;
  const getContent = async () => {
    tenant = { ...tenant.dataValues };

    let content = [];
    content = content.concat({
      columns: [
        // {
        //   image: "./assets_logo.png",
        //   width: 150,
        // },
        {
          text: "Post Surgical Rehabilitation Projections",
          fontSize: 15,
          color: "black",
          alignment: "center",
          marginTop: 40,
          bold: true,
        },
      ],
    });

    content = content.concat([
      delimeter,
      section("Injured Party Information", {}, true),
      delimeter,
    ]);
    content.push(injuryInformation(claimant, report, true));

    content.push(delimeter);

    // content.push({
    //   text: "",
    //   pageBreak: "before",
    // });

    content.push(
      RichTextField("Medical Care Summary", report.medical_summary, true)
    );

    content.push(
      RichTextField("Current Medical Status", report.medical_status, true)
    );
    content.push(delimeter);
    content.push(
      RichTextField(
        "Projected Future Medical Care",
        report.projected_treatment_plan,
        true
      )
    );
    content.push(delimeter);

    content = content.concat([
      delimeter,
      section("Causation", {}, true),
      delimeter,
      p(report.additional_comments),
    ]);
    // content.push(
    //   RichTextField(
    //     "Compensability",
    //     `<>${report.additional_comments}</>`,
    //     true
    //   )
    // );
    // content.push({
    //   text: "",
    //   pageBreak: "before",
    // });
    content.push(
      newSection("Post Surgical Rehabilitation Projections", {
        pageBreak: "before",
        pageOrientation: "landscape",
      })
    );
    content.push(delimeter);

    content.push(
      msaTable(
        report,

        reportAll.medicare.filter(
          (item) => item.type === "Future Medical Need covered by Medicare"
        ),
        "Medical Costs",
        "Medical Costs Total:",
        {},
        true
      )
    );
    content.push(delimeter);
    content.push(delimeter);
    content.push(
      msaTable(
        report,
        reportAll.medicare.filter(
          (item) => item.type === "Surgeries, Replacements & Procedures"
        ),
        "Surgeries, Replacements and Procedures",
        "Surgical costs total:",
        {},
        true
      )
    );
    content.push(delimeter);
    content.push(delimeter);
    content.push(
      msaTableP(
        report,
        reportAll.medicare.filter(
          (item) => item.type === "Prescription Medications Covered"
        ),
        "Prescription Medications Covered",
        {},
        true
      )
    );
    content.push(delimeter);
    content.push(delimeter);
    content.push(delimeter);
    content.push(delimeter);
    content.push(
      unbreakable(
        [
          msaKeyValue(
            "Annual Cost Total",
            moneyString(total_annual_medicare_costs_(reportAll.medicare))
          ),
          msaKeyValue(
            "Recommended Medical Cost",
            moneyString(
              section_total(
                reportAll.medicare,
                "Future Medical Need covered by Medicare"
              )
            )
          ),
          msaKeyValue(
            "Surgeries, Replacements & Procedures Cost",
            moneyString(
              section_total(
                reportAll.medicare,
                "Surgeries, Replacements & Procedures"
              )
            )
          ),
          msaKeyValue(
            "Recommended Prescription Cost",
            moneyString(
              section_total(
                reportAll.medicare,
                "Prescription Medications Covered"
              )
            )
          ),
          msaKeyValue(
            "Recommended Cost",
            moneyString(total_anticipated_medicare_cost(reportAll.medicare))
          ),
          report.settings.inflation
            ? msaKeyValue(
                "Recommended Inflation Cost",
                moneyString(
                  claculate_inflation_forMultiple(
                    report.settings,
                    reportAll.medicare
                  ) - total_anticipated_medicare_cost(reportAll.medicare)
                )
              )
            : delimeter,
          report.settings.inflation
            ? msaKeyValue(
                "Recommended Cost With Inflation",
                moneyString(
                  claculate_inflation_forMultiple(
                    report.settings,
                    reportAll.medicare
                  )
                )
              )
            : delimeter,
          delimeter,
        ],
        true
      )
    );

    return content;
  };
  let content = await getContent();
  // console
  let docData = {
    content: content,
    header: headerSurgical(client_logo),
    footer: footer(tenant, true),
    pageBreakBefore: function (
      currentNode,
      followingNodesOnPage,
      nodesOnNextPage,
      previousNodesOnPage
    ) {
      // if (!currentNode.id) {
      //   return false;
      // }
      if (currentNode.startPosition.top > 720) {
        return true;
      }

      if (currentNode.id) {
        if (
          (currentNode.id === "Surgeries, Replacements and Procedures" ||
            currentNode.id === "Medical Costs" ||
            currentNode.id === "Prescription Medications Covered") &&
          // currentNode.pageNumbers.length > 1 &&
          currentNode.startPosition.top > 370
        ) {
          return true;
        }
        if (currentNode.id.includes("section")) {
          let followingNodesIds = followingNodesOnPage.map((node) => node.id);
          // .join("");
          if (followingNodesIds[1]) {
            followingNodesIds = followingNodesIds[1];
            let is_first_part =
              followingNodesIds.includes("defense_attorney") ||
              followingNodesIds.includes("insurance_carrier") ||
              followingNodesIds.includes("treating_providers") ||
              followingNodesIds.includes("defense_attorney");
            let isSecondPart = currentNode.startPosition.top > 610;
            if (isSecondPart && is_first_part) {
              return true;
            }
          }
        }
        if (
          currentNode.id.includes("section") &&
          currentNode.startPosition.top > 700
        ) {
          return true;
        }
      }
      if (
        // currentNode.id === "Body Parts Accepted" &&
        currentNode.startPosition.top > 720 &&
        currentNode.style &&
        currentNode.style[0] == "html-p"
      ) {
        return true;
      }
      //check if signature part is completely on the last page, add pagebreak if not

      return false;
    },
    pageMargins: [40, 90, 40, 50],
    styles: {
      table: {
        fontSize: 9,
        aligment: "center",
      },
      footer: {
        fontSize: 8,
        bold: true,
      },
      field_name: {
        fontSize: 9,
        bold: true,
      },
      field_value: {
        fontSize: 9,
      },
      section_title: {
        fontSize: 15,
        bold: true,
      },
      tableHeader: {
        fontSize: 8,
        bold: true,
      },
      "html-li": {
        fontSize: 9,
      },
      "html-ol": {
        fontSize: 9,
      },
      "html-ul": {
        fontSize: 9,
      },
      "html-p": {
        fontSize: 9,
      },
      "html-span": {
        fontSize: 9,
      },
      text: { fontSize: 9 },
      noDelim: { fontSize: 9, margin: [5, 2, 0, 2], bold: true },
    },
  };

  let report = new Promise((resolve, reject) => {
    const pdfDoc = new PdfPrinter({
      "calibri,sans-serif": {
        normal: new Buffer(
          require("pdfmake/build/vfs_fonts.js").pdfMake.vfs[
            "Roboto-Regular.ttf"
          ],
          "base64"
        ),
      },
      Roboto: {
        bolditalics: new Buffer(
          require("pdfmake/build/vfs_fonts.js").pdfMake.vfs[
            "Roboto-Italic.ttf"
          ],
          "base64"
        ),
        italics: new Buffer(
          require("pdfmake/build/vfs_fonts.js").pdfMake.vfs[
            "Roboto-Italic.ttf"
          ],
          "base64"
        ),
        normal: new Buffer(
          require("pdfmake/build/vfs_fonts.js").pdfMake.vfs[
            "Roboto-Regular.ttf"
          ],
          "base64"
        ),
        bold: new Buffer(
          require("pdfmake/build/vfs_fonts.js").pdfMake.vfs[
            "Roboto-Medium.ttf"
          ],
          "base64"
        ),
      },
    }).createPdfKitDocument(docData);
    // console.log(docData);
    const chunks = [];
    pdfDoc.on("readable", () => {
      let chunk;
      while ((chunk = pdfDoc.read()) !== null) {
        chunks.push(chunk);
      }
    });
    pdfDoc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
  let res = await report;
  //console.log(res.toString());
  // fs.writeFile("test.pdf", res, () => {});
  var AWS = require("aws-sdk");
  var s3Bucket = new AWS.S3({});
  var data = {
    Key: `${"report_mcp" + +new Date() + report.id}/${
      claimant.claimant_name + " " + claimant.claimant_last_name
    }.${"pdf"}`,
    Body: res,
    ContentType: `application/pdf`,
    ACL: "public-read",
  };
  let uploadData = await s3Bucket.upload(data).promise();
  return uploadData;
};

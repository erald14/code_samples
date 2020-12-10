import React, { useState, useEffect } from "react";
import { Select, Radio } from "antd";
import "./EditUserRoles.scss";
import * as API from "utils/api";

//This is a Select Component that Edits a user roles.
export default function EditUserRoles({ user_id }) {
  const [roles, setRoles] = useState([]);
  const [selectedValues, setSelectedValues] = useState([]);
  useEffect(() => {
    if (user_id) {
      API.GetUserRoles(user_id).then((roles) => {
        //fetch user roles
        if (roles.user_roles.roles) {
          //update state with current roles
          setSelectedValues(roles.user_roles.roles.map((role) => role.id));
        }
      });
    }
    if (roles.length < 1) {
      //Condition called when roles arent  fetched already.This should have been done with a boolean value, but we know roles will always be more that 1
      API.getNurseRoles().then((res) => {
        //fetch all  roles

        setRoles(res.roles);
      });
    }
  }, [user_id]); //Since this might change since its called and user id is controlled by state in parent component ,I want use Effect to be called everytime user_id changes
  const { Option } = Select;
  const children = [];
  for (let i = 0; i < roles.length; i++) {
    children.push(
      <Option key={i.toString(36) + i} value={roles[i].id}>
        {roles[i].name}
      </Option>
    );
  }

  const onDeselect = (role_id, secParam, third) => {
    //x is clicked on the dropdown
    let roles = selectedValues.filter((id) => id != role_id);
    setSelectedValues([...roles]);
    API.DeleteRoles(user_id, role_id);
  };
  const onSelect = (role_id) => {
    //new Role is selected
    let roles = [...selectedValues];
    let role = roles.find((role) => role.id === role_id);
    roles.push(role.id);
    API.AddRole(user_id, role_id).then((res) => {
      setSelectedValues([...roles]);
    });

    // API.DeleteRoles(user_id, role_id);
  };
  return (
    <div>
      <Select
        mode="multiple"
        value={selectedValues}
        onDeselect={onDeselect}
        placeholder="Please select"
        onSelect={onSelect}
        style={{ width: "100%" }}
      >
        {children}
      </Select>
    </div>
  );
}

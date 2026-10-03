import axios from "../utils/api";
import {
  authRequest,
  authSuccess,
  authFailed,
  authError,
  stuffAdded,
  getDeleteSuccess,
  getRequest,
  getFailed,
  getError,
  productSuccess,
  productDetailsSuccess,
  getProductDetailsFailed,
  getProductsFailed,
  setFilteredProducts,
  getSearchFailed,
  sellerProductSuccess,
  getSellerProductsFailed,
  stuffUpdated,
  updateFailed,
  getCustomersListFailed,
  customersListSuccess,
  getSpecificProductsFailed,
  specificProductSuccess,
  updateCurrentUser,
} from "./userSlice";

export const authUser = (fields, role, mode) => async (dispatch) => {
  dispatch(authRequest());

  try {
    const result = await axios.post(
      `${import.meta.env.VITE_API_URL || "/api"}/${role}${mode}`,
      fields,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    if (result.data.role) {
      dispatch(authSuccess(result.data));
    } else {
      dispatch(authFailed(result.data.message));
    }
  } catch (error) {
    dispatch(
      authFailed(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
    return false;
  }
};

export const addStuff = (address, fields) => async (dispatch) => {
  dispatch(authRequest());

  try {
    const result = await axios.post(
      `${import.meta.env.VITE_API_URL || "/api"}/${address}`,
      fields,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    if (result.data.message) {
      dispatch(authFailed(result.data.message));
      return false;
    } else {
      dispatch(stuffAdded());
      return true;
    }
  } catch (error) {
    dispatch(
      authFailed(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
    return false;
  }
};

export const updateStuff = (fields, id, address) => async (dispatch) => {
  try {
    const result = await axios.put(
      `${import.meta.env.VITE_API_URL || "/api"}/${address}/${id}`,
      fields,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    if (result.data.message) {
      dispatch(updateFailed(result.data.message));
    } else {
      dispatch(stuffUpdated());
    }
  } catch (error) {
    dispatch(
      getError(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
  }
};

export const deleteStuff = (id, address) => async (dispatch) => {
  dispatch(getRequest());

  try {
    const result = await axios.delete(
      `${import.meta.env.VITE_API_URL || "/api"}/${address}/${id}`,
    );
    if (result.data.message) {
      dispatch(getFailed(result.data.message));
    } else {
      dispatch(getDeleteSuccess());
    }
  } catch (error) {
    dispatch(
      getError(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
  }
};

export const updateCustomer = (fields, id) => async (dispatch) => {
  dispatch(updateCurrentUser(fields));

  const newFields = { ...fields };
  delete newFields.token;

  try {
    await axios.put(
      `${import.meta.env.VITE_API_URL || "/api"}/CustomerUpdate/${id}`,
      newFields,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    dispatch(stuffUpdated());
  } catch (error) {
    dispatch(
      getError(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
  }
};

export const getProductsbySeller = (id) => async (dispatch) => {
  dispatch(getRequest());

  try {
    const result = await axios.get(
      `${import.meta.env.VITE_API_URL || "/api"}/getSellerProducts/${id}`,
    );
    if (result.data.message) {
      dispatch(getSellerProductsFailed(result.data.message));
    } else {
      dispatch(sellerProductSuccess(result.data));
    }
  } catch (error) {
    dispatch(
      getError(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
  }
};

export const getProducts = () => async (dispatch) => {
  dispatch(getRequest());

  try {
    const result = await axios.get(
      `${import.meta.env.VITE_API_URL || "/api"}/getProducts`,
    );
    if (result.data.message) {
      dispatch(getProductsFailed(result.data.message));
    } else {
      dispatch(productSuccess(result.data));
    }
  } catch (error) {
    dispatch(
      getError(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
  }
};

export const getProductDetails = (id) => async (dispatch) => {
  dispatch(getRequest());

  try {
    const result = await axios.get(
      `${import.meta.env.VITE_API_URL || "/api"}/getProductDetail/${id}`,
    );
    if (result.data.message) {
      dispatch(getProductDetailsFailed(result.data.message));
    } else {
      dispatch(productDetailsSuccess(result.data));
    }
  } catch (error) {
    dispatch(
      getError(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
  }
};

export const getCustomers = (id, address) => async (dispatch) => {
  dispatch(getRequest());

  try {
    const result = await axios.get(
      `${import.meta.env.VITE_API_URL || "/api"}/${address}/${id}`,
    );
    if (result.data.message) {
      dispatch(getCustomersListFailed(result.data.message));
    } else {
      dispatch(customersListSuccess(result.data));
    }
  } catch (error) {
    dispatch(
      getError(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
  }
};

export const getSpecificProducts = (id, address) => async (dispatch) => {
  dispatch(getRequest());
  try {
    const result = await axios.get(
      `${import.meta.env.VITE_API_URL || "/api"}/${address}/${id}`,
    );
    if (result.data.message) {
      dispatch(getSpecificProductsFailed(result.data.message));
    } else {
      dispatch(specificProductSuccess(result.data));
    }
  } catch (error) {
    dispatch(
      getError(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
  }
};

export const getSearchedProducts = (address, key) => async (dispatch) => {
  dispatch(getRequest());

  try {
    const result = await axios.get(
      `${import.meta.env.VITE_API_URL || "/api"}/${address}/${encodeURIComponent(key)}`,
    );
    if (result.data.message) {
      dispatch(getSearchFailed(result.data.message));
    } else {
      dispatch(setFilteredProducts(result.data));
    }
  } catch (error) {
    dispatch(
      getError(
        error.response?.data?.message ||
          "Cannot connect to the server. Please retry.",
      ),
    );
  }
};

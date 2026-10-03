import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/system';
import Products from '../../../components/Products';
import { useDispatch, useSelector } from 'react-redux';
import { getSearchedProducts } from '../../../redux/userHandle';

const CustomerSearch = ({ mode }) => {

    const dispatch = useDispatch();

    const [searchTerm, setSearchTerm] = useState("")

    const { filteredProducts } = useSelector(state => state.user);

    const handleSearch = (e) => {
        e.preventDefault()

        dispatch(getSearchedProducts("searchProduct", searchTerm));
    };

    return (
        <div>
            {
                mode === "Mobile" ?

                    <>
                        <SearchContainer onSubmit={handleSearch}>
                            <TextField
                                label="Search for products, brands and more"
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                slotProps={{
                                    input: {
                                        style: {
                                            borderRadius: 0,
                                        },
                                    }
                                }}
                            />
                        </SearchContainer>
                        {
                            searchTerm && <Products productData={filteredProducts} />
                        }
                    </>
                    :
                    <>
                        {
                            filteredProducts && <Products productData={filteredProducts} />
                        }
                    </>
            }

        </div>
    );
};

const SearchContainer = styled('form')({
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
});

export default CustomerSearch;

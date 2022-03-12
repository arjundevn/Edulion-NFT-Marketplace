import { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

import { marketplaceAddress } from "../config";

import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
    opensealink: "",
    username: "",
    email: "",
  });
  const router = useRouter();

  async function onChange(e) {
    const file = e.target.files[0];
    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }
  async function uploadToIPFS() {
    const { name, description, price, opensealink, username, email } =
      formInput;
    if (
      !name ||
      !description ||
      !price ||
      !fileUrl ||
      !opensealink ||
      !username ||
      !email
    )
      return;
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
      opensealink,
      username,
      email,
    });
    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after file is uploaded to IPFS, return the URL to use it in the transaction */
      return url;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  async function listNFTForSale(event) {
    event.preventDefault();
    const url = await uploadToIPFS();
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    /* next, create the item */
    const price = ethers.utils.parseUnits(formInput.price, "ether");
    let contract = new ethers.Contract(
      marketplaceAddress,
      NFTMarketplace.abi,
      signer
    );
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();
    let transaction = await contract.createToken(url, price, {
      value: listingPrice,
    });
    await transaction.wait();

    router.push("/");
  }

  return (
    <div className='flex justify-center'>
      <form className='flex w-1/2 flex-col pb-12' onSubmit={listNFTForSale}>
        <input
          placeholder='Asset Name'
          className='mt-8 rounded border p-4'
          value={formInput.name}
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
          required={true}
        />
        <textarea
          placeholder='Asset Description'
          className='mt-2 rounded border p-4'
          value={formInput.description}
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
          required={true}
        />
        <input
          placeholder='Asset Price in Eth'
          className='mt-2 rounded border p-4'
          value={formInput.price}
          onChange={(e) =>
            updateFormInput({ ...formInput, price: e.target.value })
          }
          required={true}
        />
        <input
          type='file'
          name='Asset'
          className='mt-2'
          onChange={onChange}
          required={true}
        />
        {fileUrl && (
          <img
            className='mt-2 rounded'
            width='350'
            height='350'
            src={fileUrl}
            alt='Your image for nft'
          />
        )}
        <input
          placeholder='OpenSea Link'
          className='mt-2 rounded border p-4'
          value={formInput.opensealink}
          onChange={(e) =>
            updateFormInput({ ...formInput, opensealink: e.target.value })
          }
          required={true}
        />
        <input
          placeholder='Full Name'
          className='mt-2 rounded border p-4'
          value={formInput.username}
          onChange={(e) =>
            updateFormInput({ ...formInput, username: e.target.value })
          }
          required={true}
        />
        <input
          type='email'
          placeholder='Email Address'
          className='mt-2 rounded border p-4'
          value={formInput.email}
          onChange={(e) =>
            updateFormInput({ ...formInput, email: e.target.value })
          }
          required={true}
        />
        <button
          type='submit'
          className='mt-4 rounded bg-pink-500 p-4 font-bold text-white shadow-lg'
        >
          Create NFT
        </button>
      </form>
    </div>
  );
}

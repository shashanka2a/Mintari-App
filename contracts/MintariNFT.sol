// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MintariNFT
 * @dev ERC-1155 NFT contract for Mintari AI-generated art
 * @author Mintari Team
 */
contract MintariNFT is ERC1155, Ownable, Pausable, ReentrancyGuard {
    using Strings for uint256;

    // Token ID counter
    uint256 private _tokenIdCounter = 1;

    // Base URI for metadata
    string private _baseURI;

    // Token metadata mapping
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _tokenCreators;
    mapping(uint256 => uint256) private _tokenPrices;

    // Events
    event TokenMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed to,
        uint256 amount,
        string metadataURI
    );

    event TokenPriceSet(uint256 indexed tokenId, uint256 price);
    event BaseURISet(string newBaseURI);

    // Errors
    error InvalidTokenId();
    error InvalidAmount();
    error InsufficientPayment();
    error TokenNotForSale();
    error TransferFailed();

    constructor(
        string memory baseURI_,
        address initialOwner
    ) ERC1155("") Ownable(initialOwner) {
        _baseURI = baseURI_;
    }

    /**
     * @dev Mint new tokens to a specific address
     * @param to Address to mint tokens to
     * @param amount Number of tokens to mint
     * @param metadataURI Metadata URI for the token
     * @return tokenId The ID of the minted token
     */
    function mint(
        address to,
        uint256 amount,
        string memory metadataURI
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256) {
        if (to == address(0)) revert InvalidTokenId();
        if (amount == 0) revert InvalidAmount();

        uint256 tokenId = _tokenIdCounter++;
        _tokenURIs[tokenId] = metadataURI;
        _tokenCreators[tokenId] = msg.sender;

        _mint(to, tokenId, amount, "");

        emit TokenMinted(tokenId, msg.sender, to, amount, metadataURI);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple tokens
     * @param to Address to mint tokens to
     * @param amounts Array of amounts for each token
     * @param metadataURIs Array of metadata URIs
     * @return tokenIds Array of minted token IDs
     */
    function mintBatch(
        address to,
        uint256[] memory amounts,
        string[] memory metadataURIs
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256[] memory) {
        if (to == address(0)) revert InvalidTokenId();
        if (amounts.length != metadataURIs.length) revert InvalidAmount();

        uint256[] memory tokenIds = new uint256[](amounts.length);
        uint256[] memory ids = new uint256[](amounts.length);

        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) revert InvalidAmount();

            uint256 tokenId = _tokenIdCounter++;
            tokenIds[i] = tokenId;
            ids[i] = tokenId;
            _tokenURIs[tokenId] = metadataURIs[i];
            _tokenCreators[tokenId] = msg.sender;

            emit TokenMinted(tokenId, msg.sender, to, amounts[i], metadataURIs[i]);
        }

        _mintBatch(to, ids, amounts, "");

        return tokenIds;
    }

    /**
     * @dev Public mint function for users to purchase tokens
     * @param tokenId ID of the token to mint
     * @param amount Number of tokens to mint
     */
    function publicMint(
        uint256 tokenId,
        uint256 amount
    ) external payable nonReentrant whenNotPaused {
        if (tokenId == 0 || tokenId >= _tokenIdCounter) revert InvalidTokenId();
        if (amount == 0) revert InvalidAmount();

        uint256 price = _tokenPrices[tokenId];
        if (price == 0) revert TokenNotForSale();
        if (msg.value < price * amount) revert InsufficientPayment();

        _mint(msg.sender, tokenId, amount, "");

        // Refund excess payment
        if (msg.value > price * amount) {
            uint256 refund = msg.value - (price * amount);
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @dev Set the price for a token
     * @param tokenId ID of the token
     * @param price Price in wei
     */
    function setTokenPrice(uint256 tokenId, uint256 price) external onlyOwner {
        if (tokenId == 0 || tokenId >= _tokenIdCounter) revert InvalidTokenId();
        _tokenPrices[tokenId] = price;
        emit TokenPriceSet(tokenId, price);
    }

    /**
     * @dev Get the price of a token
     * @param tokenId ID of the token
     * @return price Price in wei
     */
    function getTokenPrice(uint256 tokenId) external view returns (uint256) {
        return _tokenPrices[tokenId];
    }

    /**
     * @dev Get the creator of a token
     * @param tokenId ID of the token
     * @return creator Address of the creator
     */
    function getTokenCreator(uint256 tokenId) external view returns (address) {
        return _tokenCreators[tokenId];
    }

    /**
     * @dev Get the current token ID counter
     * @return counter Current counter value
     */
    function getTokenIdCounter() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Override URI function to return token-specific metadata
     * @param tokenId ID of the token
     * @return URI Metadata URI for the token
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        if (tokenId == 0 || tokenId >= _tokenIdCounter) revert InvalidTokenId();
        
        string memory tokenURI = _tokenURIs[tokenId];
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }
        
        return string(abi.encodePacked(_baseURI, tokenId.toString()));
    }

    /**
     * @dev Set the base URI for metadata
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
        emit BaseURISet(newBaseURI);
    }

    /**
     * @dev Get the base URI
     * @return baseURI Current base URI
     */
    function getBaseURI() external view returns (string memory) {
        return _baseURI;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{value: balance}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @dev Emergency withdraw to a specific address
     * @param to Address to withdraw to
     */
    function emergencyWithdraw(address to) external onlyOwner {
        if (to == address(0)) revert InvalidTokenId();
        
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(to).call{value: balance}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @dev Override supportsInterface to include custom interfaces
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

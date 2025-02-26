import { appDataDir, join } from "@tauri-apps/api/path";
import { message } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { createSignal, onMount } from "solid-js";
import "./Basic-AddToCollection-PopUp.css";

const appDir = await appDataDir();
const dirPath = appDir;

async function userCollectionPath() {
 return await join(dirPath, "library", "collections");
}

const BasicAddToCollectionPopup = ({
 infoTitle,
 infoMessage,
 collectionsList,
 gameObjectInfo,
}) => {
 const [selectedCollections, setSelectedCollections] = createSignal([]);
 const [possibleCollections, setPossibleCollections] = createSignal([]);

 function closePopup() {
  const popup = document.querySelector(".popup-addtocollection-overlay");
  if (popup) {
   popup.classList.remove("show");
   setTimeout(() => {
    popup.remove();
   }, 300); // Matches transition duration
  }
 }

 function toggleCollection(collectionName) {
  setSelectedCollections(prev => {
   if (prev.includes(collectionName)) {
    return prev.filter(name => name !== collectionName);
   } else {
    return [...prev, collectionName];
   }
  });
 }

 async function confirmSelection() {
  await addToCollectionFile();
  closePopup();
 }

 onMount(() => {
  function checkIfUserCreatedCollection(collectionName) {
   console.log(collectionName);
   return (
    collectionName !== "downloaded_games" &&
    collectionName !== "games_to_download"
   );
  }
  console.warn(collectionsList);

  setPossibleCollections(
   Object.entries(collectionsList) // Convert object to array of [key, value]
    .filter(([key, value]) => checkIfUserCreatedCollection(key)) // Use key to filter by name
    .reduce((acc, [key, value]) => {
     acc[key] = value;
     return acc;
    }, {}),
  );
 });

 onMount(() => {
  const popup = document.querySelector(".popup-addtocollection-overlay");
  if (popup) {
   setTimeout(() => {
    popup.classList.add("show");
   }, 10); // Small delay to trigger transition
  }
 });

 async function addToCollectionFile() {
  const collectionFolderPath = await userCollectionPath();

  selectedCollections().forEach(async collectionName => {
   try {
    const jsonFullName = collectionName + ".json";
    const collectionFilePath = await join(collectionFolderPath, jsonFullName);

    const fileContent = await readTextFile(collectionFilePath);
    let currentData = JSON.parse(fileContent);
    console.warn(currentData);
    const isDuplicate = currentData.some(
     item =>
      item.torrentExternInfo.title === gameObjectInfo.torrentExternInfo.title,
    );

    if (!isDuplicate) {
     currentData.push(gameObjectInfo);
     await writeTextFile(
      collectionFilePath,
      JSON.stringify(currentData, null, 2),
     );
     await message("Your Game has been added correctly !", {
      title: "Everything is good",
      kind: "info",
     });
    } else {
     console.log("The object already exists in the data.");
     await message(
      "The game already exists in the collection, it won't add it",
      { title: "FitLauncher Error", kind: "warning" },
     );
    }

    window.location.reload();
   } catch (error) {
    let formattedError = ("Error adding game to collection : ", error);
    await message(formattedError, {
     title: "FitLauncher Error",
     kind: "error",
    });
   }
  });
 }

 function formatKeyName(key) {
  return key
   .split("_")
   .map(word => word.charAt(0).toUpperCase() + word.slice(1) + " ");
 }

 return (
  <div class="popup-addtocollection-overlay">
   <div class="basic-addtocollection-popup">
    <div class="popup-content">
     <div class="popup-text-title">
      <p class="popup-main-title">
       {infoTitle || "Please choose a collection :)"}
      </p>
     </div>
     <div class="popup-collection-container">
      {possibleCollections() ? (
       <For each={Object.keys(possibleCollections())}>
        {collectionKey => (
         <div class="popup-collection-item" key={collectionKey}>
          <li class="popup-category-list-item">
           {formatKeyName(collectionKey)}
           <label class="switch">
            <input
             type="checkbox"
             checked={selectedCollections().includes(collectionKey)}
             onchange={() => toggleCollection(collectionKey)}
            />
            <span class="switch-slider round"></span>
           </label>
          </li>
         </div>
        )}
       </For>
      ) : (
       <p>Nothing here...</p>
      )}
     </div>

     <div class="popup-footer-container">
      {"Select one or more collections to add your games to."}
     </div>
    </div>
    <div class="popup-buttons">
     <button id="popup-cancel-button" onclick={closePopup}>
      Cancel
     </button>
     <button
      id="popup-confirm-button"
      onclick={async () => {
       await confirmSelection();
      }}
     >
      Confirm
     </button>
    </div>
   </div>
  </div>
 );
};

export default BasicAddToCollectionPopup;

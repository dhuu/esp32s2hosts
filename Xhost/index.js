let mainMenu;
let mainMenuKeys;
let mainMenuLength;
let mainMenuActiveIndex = 0;
let mainSubmenuActiveIndex = 0;
let mainMenuRows;

let showContextMenu = false;
let contextMenuCurrent;
let contextMenuItems;
let contextMenuItemsMeta = {};
let contextMenuActiveMenuIndex = 0;
let xhostAppData = {};

const getContextSelectables = () => {
  return Array.from($(".xhost__button__payload", $("?.xhost__context"))).filter(
    (el) => el.getAttribute("hidden") != ""
  );
};

const xhostMouseUp = (e) => {
  if (e) {
    e.preventDefault();
  }
  let targetEl;
  if (showContextMenu) {
    targetEl = contextMenuItems[contextMenuActiveMenuIndex];
  } else {
    targetEl =
      mainMenu[mainMenuKeys[mainMenuActiveIndex]].items[mainSubmenuActiveIndex];
  }

  const { action, actionParams } = targetEl;

  if (!action) {
    return;
  }

  if (
    [
      "loadBinaryLoader",
      "loadLinux",
      "loadMira",
      "loadMiraJailbreak",
      "postBinaryPayload",
      "setFan",
    ].includes(action)
  ) {
    if ($(".iframe").contentWindow.checkNeedsReload()) {
      return;
    }
  }

  actions["action__" + action].call(null, actionParams);

  if (!targetEl.silent) {
    notify(`Running Payload: ${targetEl.name}`);
  }
  return;
};

document.addEventListener("mouseup", xhostMouseUp);

window.addEventListener("keyup", (e) => {
  if (e.key == "Enter") {
    xhostMouseUp();
  }
});

document.addEventListener("keydown", (e) => {
  e.preventDefault();

  if (showContextMenu) {
    switch (e.keyCode) {
      case 38: // up
        contextMenuActiveMenuIndex -= 1;
        if (contextMenuActiveMenuIndex < 0) {
          contextMenuActiveMenuIndex = 0;
        }
        break;
      case 40: // down
        contextMenuActiveMenuIndex += 1;
        if (contextMenuActiveMenuIndex >= getContextSelectables().length) {
          contextMenuActiveMenuIndex = getContextSelectables().length - 1;
        }
        break;
    }

    renderContextMenu();

    if (contextMenuItems[contextMenuActiveMenuIndex].action === "select") {
      const tmpParams =
        contextMenuItems[contextMenuActiveMenuIndex].actionParams;
      action__selectParams.params = tmpParams;

      $(".xhost__select").innerHTML = Object.keys(tmpParams.options).reduce(
        (acc, key) => {
          const selected =
            selectStores[tmpParams.store] === tmpParams.options[key];
          acc += `<option value='${tmpParams.options[key]}'${
            selected ? " selected" : ""
          }>${key}</option>`;
          return acc;
        },
        ""
      );

      $(".xhost__select").style.display = "block";
    } else {
      $(".xhost__select").style.display = "none";
    }

    return;
  }

  switch (e.keyCode) {
    case 37: // left
      mainSubmenuActiveIndex -= 1;
      if (mainSubmenuActiveIndex < 0) {
        mainSubmenuActiveIndex = 0;
      }
      break;
    case 39: // right
      mainSubmenuActiveIndex += 1;
      if (
        mainSubmenuActiveIndex >=
        mainMenu[mainMenuKeys[mainMenuActiveIndex]].items.length
      ) {
        mainSubmenuActiveIndex =
          mainMenu[mainMenuKeys[mainMenuActiveIndex]].items.length - 1;
      }
      break;
    case 38: // up
      mainMenuActiveIndex -= 1;
      if (mainMenuActiveIndex < 0) {
        mainMenuActiveIndex = mainMenuRows.length - 1;
      }
      mainSubmenuActiveIndex = 0;
      break;
    case 40: // down
      mainMenuActiveIndex += 1;
      if (mainMenuActiveIndex > mainMenuRows.length - 1) {
        mainMenuActiveIndex = 0;
      }
      mainSubmenuActiveIndex = 0;
      break;
  }
  renderMainMenu();
});

const generateMainMenu = () => {
  const container = $(".section-container");
  const outputHTML = Object.keys(mainMenu).reduce((acc, key, idx) => {
    const items = mainMenu[key].items
      .map((item) => {
        return `<button class="xhost__button xhost__button__payload ${
          mainMenu[key].smallButtons ? "xhost__button__small" : ""
        }"><div class="xhost__item-name">${
          item.name
        }</div><div class="xhost-payload__desc">${
          item.desc ? item.desc : ""
        }</div></button>`;
      })
      .join("");
    return `${acc}<section row="${idx}" ${
      idx === mainMenuActiveIndex ? "" : "disabled"
    } class="${
      idx === mainMenuActiveIndex ? "active" : ""
    }"><button active class="xhost__button xhost__button__menu xhost__button__secondary xhost__button__payload"><div>${key}</div></button><div class="xhost__selectable-items">${items}</div></section>`;
  }, "");

  container.innerHTML = container.innerHTML + outputHTML;

  const rows = $(`?[row]`);
  mainMenuRows = rows.length ? rows : [rows];
};

// const computeContext = (path, obj) => {
//   return path.split(".").reduce((o, i) => o[i], obj);
// };

const computeContext = (str, context) => {
  return str.match(/({{(.+?)}})/gi).reduce(
    (acc, match) =>
      acc.replaceAll(
        match,
        match
          .replace(/[{}]./g, "")
          .split(".")
          .reduce((o, i) => o[i], context)
      ),
    str
  );
};

const generateContextMenu = (items) => {
  const output =
    "<ul>" +
    items
      .map((item) => {
        return `<li><button class="xhost__button xhost__button__payload ${
          item.class ? item.class : ""
        }">
  <div>${
    item.name$ ? computeContext(item.name$, xhostAppData) : item.name
  }</div>
  <div class="xhost-payload__desc">${
    item.desc$ ? computeContext(item.desc$, xhostAppData) : item.desc || ""
  }</div>
</button></li>`;
      })
      .join("") +
    "</ul>";
  $(".xhost__context").innerHTML = output;
};

const renderContextMenu = () => {
  const selectables = getContextSelectables();
  selectables.forEach((el) => {
    el.removeAttribute("active");
  });
  selectables[contextMenuActiveMenuIndex].setAttribute("active", "");
  selectables[contextMenuActiveMenuIndex].scrollIntoView();
  contextMenuCurrent = selectables[contextMenuActiveMenuIndex];
};

const renderMainMenu = () => {
  console.log(mainMenuRows);
  if (!mainMenuRows) {
    return;
  }
  mainMenuRows.forEach((e) => {
    e.setAttribute("disabled", "");
    e.classList.remove("active");
  });
  const activeRow = $(`?[row="${mainMenuActiveIndex}"]`);
  activeRow.removeAttribute("disabled");
  activeRow.classList.add("active");

  $("?.xhost__selectable-items button").forEach((el) => {
    el.removeAttribute("active");
  }, mainMenuRows[mainMenuActiveIndex]);

  const selectables = $(
    "?.xhost__selectable-items button",
    mainMenuRows[mainMenuActiveIndex]
  );
  let target;
  if (selectables.length) {
    target = selectables[mainSubmenuActiveIndex];
  } else {
    target = selectables;
  }

  target.setAttribute("active", "");
  target.scrollIntoView({ behavior: "smooth", block: "center" });
};

const removeHiddenMenus = (menu) => {
  return Object.keys(menu).reduce((acc, key) => {
    acc[key] = menu[key];

    if (acc[key].items) {
      acc[key].items = menu[key].items.filter((e) => {
        return e.guard
          ? guards[`guard__${e.guard}`](
              e.guardParams ? e.guardParams : undefined
            )
          : true;
      });
    }
    return acc;
  }, {});
};

let xhostMain = () => {
  return fetch("menu.json")
    .then((r) => r.json())
    .then((r) => removeHiddenMenus(r))
    .then((menuJson) => {
      mainMenu = menuJson;
      mainMenuKeys = Object.keys(mainMenu);
      mainMenuLength = mainMenuKeys.length;
      action__showPayloads();
      generateMainMenu();
      renderMainMenu();
      if (window.autoloadGoldHen) {
        notify("Autoloading GoldHEN please wait...");
        actions["action__postBinaryPayload"]("pl_goldhen222.bin");
      }
      return menuJson;
    });
};

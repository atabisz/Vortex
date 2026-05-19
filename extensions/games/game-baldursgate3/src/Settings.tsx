import React from "react";
import { ControlLabel, FormGroup, HelpBlock, Panel } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useSelector, useStore } from "react-redux";
import { Toggle, types } from "vortex-api";
<<<<<<< HEAD

=======
>>>>>>> v2.0.1
import { setAutoExportLoadOrder } from "./actions";

function Settings() {
  const store = useStore();

  const autoExportLoadOrder = useSelector(
<<<<<<< HEAD
    (state: types.IState) => state.settings["baldursgate3"]?.autoExportLoadOrder,
  );

  const setUseAutoExportLoadOrderToGame = React.useCallback((enabled: boolean) => {
    console.log(`setAutoExportLoadOrder=${enabled}`);
    store.dispatch(setAutoExportLoadOrder(enabled));
  }, []);

=======
    (state: types.IState) =>
      state.settings["baldursgate3"]?.autoExportLoadOrder,
  );

  const setUseAutoExportLoadOrderToGame = React.useCallback(
    (enabled: boolean) => {
      console.log(`setAutoExportLoadOrder=${enabled}`);
      store.dispatch(setAutoExportLoadOrder(enabled));
    },
    [],
  );

>>>>>>> v2.0.1
  const { t } = useTranslation();

  return (
    <form>
      <FormGroup controlId="default-enable">
        <Panel>
          <Panel.Body>
            <ControlLabel>{t("Baldur's Gate 3")}</ControlLabel>
<<<<<<< HEAD
            <Toggle checked={autoExportLoadOrder} onToggle={setUseAutoExportLoadOrderToGame}>
=======
            <Toggle
              checked={autoExportLoadOrder}
              onToggle={setUseAutoExportLoadOrderToGame}
            >
>>>>>>> v2.0.1
              {t("Auto export load order")}
            </Toggle>
            <HelpBlock>
              {t(`If enabled, when Vortex saves it's load order, it will also update the games load order. 
              If disabled, and you wish the game to use your load order, then this will need to be completed 
              manually using the Export to Game button on the load order screen`)}
            </HelpBlock>
          </Panel.Body>
        </Panel>
      </FormGroup>
    </form>
  );
}

export default Settings;

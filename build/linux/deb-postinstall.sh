#!/bin/sh
mkdir -p /etc/polkit-1/rules.d
cat > /etc/polkit-1/rules.d/10-vortex.rules << 'EOF'
polkit.addRule(function(action, subject) {
  if (action.id === "io.nexusmods.vortex.run-elevated" && subject.active) {
    return polkit.Result.AUTH_ADMIN_KEEP;
  }
});
EOF
chmod 644 /etc/polkit-1/rules.d/10-vortex.rules

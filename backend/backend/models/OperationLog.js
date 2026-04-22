const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OperationLog = sequelize.define(
  "OperationLog",
  {
    LogID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    UserID: { type: DataTypes.INTEGER },
    OperationType: { type: DataTypes.STRING(50), allowNull: false },
    TargetType: {
      type: DataTypes.ENUM(
        "post",
        "comment",
        "user",
        "category",
        "tag",
        "revision"
      ),
      allowNull: false,
    },
    TargetID: { type: DataTypes.INTEGER },
    Details: { type: DataTypes.JSON },
    IPAddress: { type: DataTypes.TEXT },
    UserAgent: { type: DataTypes.TEXT },
    Timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "operationlogs",
    timestamps: false,
  }
);

module.exports = OperationLog;

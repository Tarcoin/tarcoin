// Copyright (c) 2011-present The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <qt/sendcoinsentry.h>
#include <qt/forms/ui_sendcoinsentry.h>

#include <QEventLoop>
#include <QJsonDocument>
#include <QJsonObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QTimer>
#include <QUrl>

#include <qt/addressbookpage.h>
#include <qt/addresstablemodel.h>
#include <qt/guiutil.h>
#include <qt/optionsmodel.h>
#include <qt/platformstyle.h>
#include <qt/walletmodel.h>

#include <QApplication>
#include <QClipboard>

SendCoinsEntry::SendCoinsEntry(const PlatformStyle *_platformStyle, QWidget *parent) :
    QWidget(parent),
    ui(new Ui::SendCoinsEntry),
    platformStyle(_platformStyle)
{
    ui->setupUi(this);

    ui->addressBookButton->setIcon(platformStyle->SingleColorIcon(":/icons/address-book"));
    ui->pasteButton->setIcon(platformStyle->SingleColorIcon(":/icons/editpaste"));
    ui->deleteButton->setIcon(platformStyle->SingleColorIcon(":/icons/remove"));

    if (platformStyle->getUseExtraSpacing())
        ui->payToLayout->setSpacing(4);

    GUIUtil::setupAddressWidget(ui->payTo, this);

    // Connect signals
    connect(ui->payAmount, &BitcoinAmountField::valueChanged, this, &SendCoinsEntry::payAmountChanged);
    connect(ui->checkboxSubtractFeeFromAmount, &QCheckBox::toggled, this, &SendCoinsEntry::subtractFeeFromAmountChanged);
    connect(ui->deleteButton, &QPushButton::clicked, this, &SendCoinsEntry::deleteClicked);
    connect(ui->useAvailableBalanceButton, &QPushButton::clicked, this, &SendCoinsEntry::useAvailableBalanceClicked);
}

SendCoinsEntry::~SendCoinsEntry()
{
    delete ui;
}

void SendCoinsEntry::on_pasteButton_clicked()
{
    // Paste text from clipboard into recipient field
    ui->payTo->setText(QApplication::clipboard()->text());
}

void SendCoinsEntry::on_addressBookButton_clicked()
{
    if(!model)
        return;
    AddressBookPage dlg(platformStyle, AddressBookPage::ForSelection, AddressBookPage::SendingTab, this);
    dlg.setModel(model->getAddressTableModel());
    if(dlg.exec())
    {
        ui->payTo->setText(dlg.getReturnValue());
        ui->payAmount->setFocus();
    }
}

void SendCoinsEntry::on_payTo_textChanged(const QString &address)
{
    updateLabel(address);
    checkTnsDomain(address);
}

void SendCoinsEntry::checkTnsDomain(const QString &address)
{
    QString domain = address.trimmed().toLower();
    if (!domain.endsWith(".tar") || domain.length() < 5) {
        m_resolvedDomain.clear();
        m_resolvedAddress.clear();
        ui->payTo->setToolTip(tr("The Tarcoin address to send the payment to"));
        return;
    }

    if (domain == m_resolvedDomain && !m_resolvedAddress.isEmpty()) {
        return;
    }

    if (!m_networkManager) {
        m_networkManager = new QNetworkAccessManager(this);
    }

    QUrl url(QString("https://tarcoin.org/api/tns/resolve/%1").arg(domain));
    QNetworkRequest req(url);
    req.setHeader(QNetworkRequest::UserAgentHeader, "Tarcoin-Qt/1.2.6");
    req.setAttribute(QNetworkRequest::RedirectPolicyAttribute, QNetworkRequest::NoLessSafeRedirectPolicy);

    QNetworkReply *reply = m_networkManager->get(req);
    connect(reply, &QNetworkReply::finished, this, [this, reply, domain]() {
        reply->deleteLater();
        if (reply->error() == QNetworkReply::NoError) {
            QByteArray data = reply->readAll();
            QJsonDocument doc = QJsonDocument::fromJson(data);
            if (doc.isObject()) {
                QJsonObject obj = doc.object();
                if (obj.value("success").toBool()) {
                    QString target = obj.value("targetAddress").toString();
                    if (!target.isEmpty()) {
                        m_resolvedDomain = domain;
                        m_resolvedAddress = target;
                        ui->payTo->setToolTip(tr("TNS Domain: %1\nTarget Address: %2").arg(domain, target));
                        if (ui->addAsLabel->text().isEmpty()) {
                            ui->addAsLabel->setText(domain);
                        }
                        ui->payTo->setValid(true);
                        return;
                    }
                }
            }
        }
        m_resolvedAddress.clear();
        ui->payTo->setToolTip(tr("TNS domain '%1' could not be resolved.").arg(domain));
    });
}

void SendCoinsEntry::setModel(WalletModel *_model)
{
    this->model = _model;

    if (_model && _model->getOptionsModel())
        connect(_model->getOptionsModel(), &OptionsModel::displayUnitChanged, this, &SendCoinsEntry::updateDisplayUnit);

    clear();
}

void SendCoinsEntry::clear()
{
    m_resolvedDomain.clear();
    m_resolvedAddress.clear();
    // clear UI elements for normal payment
    ui->payTo->clear();
    ui->addAsLabel->clear();
    ui->payAmount->clear();
    if (model && model->getOptionsModel()) {
        ui->checkboxSubtractFeeFromAmount->setChecked(model->getOptionsModel()->getSubFeeFromAmount());
    }
    ui->messageTextLabel->clear();
    ui->messageTextLabel->hide();
    ui->messageLabel->hide();

    // update the display unit, to not use the default ("TAR")
    updateDisplayUnit();
}

void SendCoinsEntry::checkSubtractFeeFromAmount()
{
    ui->checkboxSubtractFeeFromAmount->setChecked(true);
}

void SendCoinsEntry::deleteClicked()
{
    Q_EMIT removeEntry(this);
}

void SendCoinsEntry::useAvailableBalanceClicked()
{
    Q_EMIT useAvailableBalance(this);
}

bool SendCoinsEntry::validate(interfaces::Node& node)
{
    if (!model)
        return false;

    // Check input validity
    bool retval = true;

    QString addrText = ui->payTo->text().trimmed();
    if (addrText.toLower().endsWith(".tar")) {
        if (m_resolvedDomain != addrText.toLower() || m_resolvedAddress.isEmpty()) {
            if (!m_networkManager) {
                m_networkManager = new QNetworkAccessManager(this);
            }
            QUrl url(QString("https://tarcoin.org/api/tns/resolve/%1").arg(addrText.toLower()));
            QNetworkRequest req(url);
            req.setHeader(QNetworkRequest::UserAgentHeader, "Tarcoin-Qt/1.2.6");
            req.setAttribute(QNetworkRequest::RedirectPolicyAttribute, QNetworkRequest::NoLessSafeRedirectPolicy);

            QNetworkReply *reply = m_networkManager->get(req);
            QEventLoop loop;
            QTimer timer;
            timer.setSingleShot(true);
            connect(&timer, &QTimer::timeout, &loop, &QEventLoop::quit);
            connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
            timer.start(3000);
            loop.exec();

            if (reply->isFinished() && reply->error() == QNetworkReply::NoError) {
                QByteArray data = reply->readAll();
                QJsonDocument doc = QJsonDocument::fromJson(data);
                if (doc.isObject()) {
                    QJsonObject obj = doc.object();
                    if (obj.value("success").toBool()) {
                        QString target = obj.value("targetAddress").toString();
                        if (!target.isEmpty()) {
                            m_resolvedDomain = addrText.toLower();
                            m_resolvedAddress = target;
                        }
                    }
                }
            }
            reply->deleteLater();
        }

        if (m_resolvedAddress.isEmpty() || !model->validateAddress(m_resolvedAddress)) {
            ui->payTo->setValid(false);
            retval = false;
        } else {
            ui->payTo->setValid(true);
        }
    } else {
        if (!model->validateAddress(ui->payTo->text()))
        {
            ui->payTo->setValid(false);
            retval = false;
        }
    }

    if (!ui->payAmount->validate())
    {
        retval = false;
    }

    // Sending a zero amount is invalid
    if (ui->payAmount->value(nullptr) <= 0)
    {
        ui->payAmount->setValid(false);
        retval = false;
    }

    // Reject dust outputs:
    QString targetForDust = m_resolvedAddress.isEmpty() ? ui->payTo->text() : m_resolvedAddress;
    if (retval && GUIUtil::isDust(node, targetForDust, ui->payAmount->value())) {
        ui->payAmount->setValid(false);
        retval = false;
    }

    return retval;
}

SendCoinsRecipient SendCoinsEntry::getValue()
{
    QString rawAddr = ui->payTo->text().trimmed();
    if (rawAddr.toLower().endsWith(".tar") && !m_resolvedAddress.isEmpty()) {
        recipient.address = m_resolvedAddress;
        recipient.label = ui->addAsLabel->text().isEmpty() ? rawAddr : ui->addAsLabel->text();
    } else {
        recipient.address = rawAddr;
        recipient.label = ui->addAsLabel->text();
    }
    recipient.amount = ui->payAmount->value();
    recipient.message = ui->messageTextLabel->text();
    recipient.fSubtractFeeFromAmount = (ui->checkboxSubtractFeeFromAmount->checkState() == Qt::Checked);

    return recipient;
}

QWidget *SendCoinsEntry::setupTabChain(QWidget *prev)
{
    QWidget::setTabOrder(prev, ui->payTo);
    QWidget::setTabOrder(ui->payTo, ui->addAsLabel);
    QWidget *w = ui->payAmount->setupTabChain(ui->addAsLabel);
    QWidget::setTabOrder(w, ui->checkboxSubtractFeeFromAmount);
    QWidget::setTabOrder(ui->checkboxSubtractFeeFromAmount, ui->addressBookButton);
    QWidget::setTabOrder(ui->addressBookButton, ui->pasteButton);
    QWidget::setTabOrder(ui->pasteButton, ui->deleteButton);
    return ui->deleteButton;
}

void SendCoinsEntry::setValue(const SendCoinsRecipient &value)
{
    recipient = value;
    {
        // message
        ui->messageTextLabel->setText(recipient.message);
        ui->messageTextLabel->setVisible(!recipient.message.isEmpty());
        ui->messageLabel->setVisible(!recipient.message.isEmpty());

        ui->addAsLabel->clear();
        ui->payTo->setText(recipient.address); // this may set a label from addressbook
        if (!recipient.label.isEmpty()) // if a label had been set from the addressbook, don't overwrite with an empty label
            ui->addAsLabel->setText(recipient.label);
        ui->payAmount->setValue(recipient.amount);
    }
}

void SendCoinsEntry::setAddress(const QString &address)
{
    ui->payTo->setText(address);
    ui->payAmount->setFocus();
}

void SendCoinsEntry::setAmount(const CAmount &amount)
{
    ui->payAmount->setValue(amount);
}

bool SendCoinsEntry::isClear()
{
    return ui->payTo->text().isEmpty();
}

void SendCoinsEntry::setFocus()
{
    ui->payTo->setFocus();
}

void SendCoinsEntry::updateDisplayUnit()
{
    if (model && model->getOptionsModel()) {
        ui->payAmount->setDisplayUnit(model->getOptionsModel()->getDisplayUnit());
    }
}

void SendCoinsEntry::changeEvent(QEvent* e)
{
    if (e->type() == QEvent::PaletteChange) {
        ui->addressBookButton->setIcon(platformStyle->SingleColorIcon(QStringLiteral(":/icons/address-book")));
        ui->pasteButton->setIcon(platformStyle->SingleColorIcon(QStringLiteral(":/icons/editpaste")));
        ui->deleteButton->setIcon(platformStyle->SingleColorIcon(QStringLiteral(":/icons/remove")));
    }

    QWidget::changeEvent(e);
}

bool SendCoinsEntry::updateLabel(const QString &address)
{
    if(!model)
        return false;

    // Fill in label from address book, if address has an associated label
    QString associatedLabel = model->getAddressTableModel()->labelForAddress(address);
    if(!associatedLabel.isEmpty())
    {
        ui->addAsLabel->setText(associatedLabel);
        return true;
    }

    return false;
}
